"use client";

import React, { useState, useEffect } from "react";
import { Loader2, DollarSign, X, Search, UserPlus, User, Phone, Check, ChevronDown, AlertCircle, MapPin } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { formatCurrency } from "@/lib/utils/currency";
import { Customer } from "@/lib/api/types";
import { customersApi } from "@/lib/api/customers";
import { CurrencyInput } from "../ui/CurrencyInput";

interface CheckoutModalProps {
    isOpen: boolean;
    totalAmount: number;
    isSubmitting: boolean;
    onClose: () => void;
    onConfirm: (payload: { paymentMethod: "CASH"|"QR_CODE", paymentStatus: "PAID"|"UNPAID", customerId: string | null, deliveryStatus: "NONE"|"PENDING", deliveryLocation: string }) => void;
}

export function CheckoutModal({ isOpen, totalAmount, isSubmitting, onClose, onConfirm }: CheckoutModalProps) {
    const { t, language } = useLanguage();
    const [cashReceived, setCashReceived] = useState<string>("");
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [searchCustomerQuery, setSearchCustomerQuery] = useState("");
    const [customerType, setCustomerType] = useState<"WALK_IN" | "EXISTING">("WALK_IN");
    
    const [paymentMethod, setPaymentMethod] = useState<"CASH" | "QR_CODE">("CASH");
    const [paymentStatus, setPaymentStatus] = useState<"PAID" | "UNPAID">("PAID");
    const [customerId, setCustomerId] = useState<string | null>(null);

    const [requiresDelivery, setRequiresDelivery] = useState(false);
    const [deliveryLocation, setDeliveryLocation] = useState("");

    const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
    const [newCustomerForm, setNewCustomerForm] = useState({ name: "", phone: "", address: "", notes: "" });
    const [isSubmittingCustomer, setIsSubmittingCustomer] = useState(false);

    const loadCustomers = async () => {
        try {
            const data = await customersApi.list();
            setCustomers(data);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        if (isOpen) {
            setCashReceived(Math.round(totalAmount).toString());
            setPaymentMethod("CASH");
            setPaymentStatus("PAID");
            setCustomerId(null);
            setIsCreatingCustomer(false);
            setNewCustomerForm({ name: "", phone: "", address: "", notes: "" });
            setRequiresDelivery(false);
            setDeliveryLocation("");
            
            loadCustomers();
        }
    }, [isOpen, totalAmount]);

    useEffect(() => {
        if (customerId) {
            const customer = customers.find(c => c.id === customerId);
            if (customer && customer.address) {
                setDeliveryLocation(customer.address);
            }
        }
    }, [customerId, customers]);

    if (!isOpen) return null;

    const received = parseFloat(cashReceived) || 0;
    const changeDue = Math.max(0, received - totalAmount);
    
    // If unpaid, we force customer selection
    const isCustomerRequired = paymentStatus === "UNPAID" && !customerId;
    const isDeliveryValid = !requiresDelivery || (requiresDelivery && deliveryLocation.trim().length > 0);
    const isCashValid = paymentStatus === "UNPAID" || paymentMethod === "QR_CODE" || received >= totalAmount;
    const isValid = isCashValid && !isCustomerRequired && isDeliveryValid;

    const handleCreateCustomer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCustomerForm.name.trim()) return;
        
        setIsSubmittingCustomer(true);
        try {
            const created = await customersApi.create(newCustomerForm);
            await loadCustomers();
            setCustomerId(created.id);
            setIsCreatingCustomer(false);
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmittingCustomer(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isSubmitting && onClose()} />
            
            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-900" style={{ fontFamily: language === 'km' ? "var(--font-noto-sans-khmer), sans-serif" : undefined }}>
                        {isCreatingCustomer ? t.createNewCustomer : t.completePayment}
                    </h2>
                    <button 
                        onClick={() => {
                            if (isCreatingCustomer) {
                                setIsCreatingCustomer(false);
                            } else {
                                onClose();
                            }
                        }} 
                        disabled={isSubmitting || isSubmittingCustomer}
                        className="p-2 -mr-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200/50 transition-colors disabled:opacity-50"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {isCreatingCustomer ? (
                    <form onSubmit={handleCreateCustomer} className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t.nameStar}</label>
                            <input
                                type="text"
                                required
                                value={newCustomerForm.name}
                                onChange={(e) => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-50 text-gray-700 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t.phone}</label>
                            <input
                                type="text"
                                value={newCustomerForm.phone}
                                onChange={(e) => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-50 text-gray-700 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t.address}</label>
                            <textarea
                                rows={2}
                                value={newCustomerForm.address}
                                onChange={(e) => setNewCustomerForm({ ...newCustomerForm, address: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-50 text-gray-700 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
                            />
                        </div>
                        <div className="pt-4 flex gap-3">
                            <button
                                type="button"
                                onClick={() => setIsCreatingCustomer(false)}
                                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50"
                            >
                                {t.cancel}
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmittingCustomer || !newCustomerForm.name.trim()}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isSubmittingCustomer ? <Loader2 className="w-5 h-5 animate-spin" /> : t.saveChanges}
                            </button>
                        </div>
                    </form>
                ) : (
                    <>
                        <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
                    {/* Amount Due */}
                    <div className="bg-indigo-50 rounded-xl p-4 flex items-center justify-between border border-indigo-100">
                        <span className="text-indigo-900 font-medium">{t.amountDue}</span>
                        <span className="text-3xl font-bold text-indigo-700">{formatCurrency(totalAmount)}</span>
                    </div>

                    {/* Customer Selection */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Customer {paymentStatus === "UNPAID" && <span className="text-red-500">*</span>}</label>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <button
                                onClick={() => {
                                    setCustomerType("WALK_IN");
                                    setCustomerId(null);
                                }}
                                className={`py-2 px-4 rounded-xl font-medium border-2 transition-all ${customerType === 'WALK_IN' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                            >
                                {t.walkInGuest}
                            </button>
                            <button
                                onClick={() => setCustomerType("EXISTING")}
                                className={`py-2 px-4 rounded-xl font-medium border-2 transition-all ${customerType === 'EXISTING' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                            >
                                {t.existingCustomer}
                            </button>
                        </div>
                        
                        {customerType === "EXISTING" && (
                            <div className="mt-3 flex flex-col gap-2">
                                <div className="relative">
                                    <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder={t.searchByNamePhone}
                                        value={searchCustomerQuery}
                                        onChange={(e) => setSearchCustomerQuery(e.target.value)}
                                        className={`w-full pl-10 pr-10 py-3 bg-white border-2 ${isCustomerRequired && !customerId ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-gray-200 focus:border-indigo-500 focus:ring-indigo-200'} rounded-xl focus:ring-4 transition-all outline-none text-gray-700`}
                                    />
                                    {searchCustomerQuery && (
                                        <button 
                                            onClick={() => setSearchCustomerQuery("")} 
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                                
                                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
                                    <div className="max-h-48 overflow-y-auto p-1.5 space-y-1">
                                        {customers
                                            .filter(c => 
                                                c.name.toLowerCase().includes(searchCustomerQuery.toLowerCase()) || 
                                                (c.phone && c.phone.includes(searchCustomerQuery))
                                            )
                                            .map(c => (
                                                <button
                                                    key={c.id}
                                                    onClick={() => setCustomerId(c.id)}
                                                    className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between transition-colors ${customerId === c.id ? 'bg-indigo-50 ring-1 ring-indigo-500/50' : 'hover:bg-gray-50'}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${customerId === c.id ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'}`}>
                                                            <User className="w-4 h-4" />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className={`text-sm font-semibold ${customerId === c.id ? 'text-indigo-900' : 'text-gray-900'}`}>{c.name}</span>
                                                            {c.phone && <span className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5"><Phone className="w-3 h-3" />{c.phone}</span>}
                                                            {c.address && <span className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5 truncate max-w-[200px]"><MapPin className="w-3 h-3 shrink-0" />{c.address}</span>}
                                                        </div>
                                                    </div>
                                                    {customerId === c.id && <Check className="w-5 h-5 text-indigo-600" />}
                                                </button>
                                            ))}
                                            {customers.filter(c => 
                                                c.name.toLowerCase().includes(searchCustomerQuery.toLowerCase()) || 
                                                (c.phone && c.phone.includes(searchCustomerQuery))
                                            ).length === 0 && (
                                                <div className="py-6 text-center flex flex-col items-center justify-center gap-2">
                                                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
                                                        <Search className="w-5 h-5 text-gray-400" />
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-500">No customers found</span>
                                                </div>
                                            )}
                                    </div>
                                    <div className="p-2 border-t border-gray-100 bg-gray-50/50">
                                        <button
                                            onClick={() => {
                                                setIsCreatingCustomer(true);
                                                setCustomerId(null);
                                            }}
                                            className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-100/50 rounded-lg transition-colors"
                                        >
                                            <UserPlus className="w-4 h-4" />
                                            {t.plusCreateNewCustomer}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                        {isCustomerRequired && !customerId && <p className="text-red-500 text-xs mt-1.5 ml-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {t.pleaseSelectExisting}</p>}
                    </div>

                    {/* Payment Status */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">{t.paymentStatus}</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setPaymentStatus("PAID")}
                                className={`py-2 px-4 rounded-xl font-medium border-2 transition-all ${paymentStatus === 'PAID' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                            >
                                {t.paid}
                            </button>
                            <button
                                onClick={() => setPaymentStatus("UNPAID")}
                                className={`py-2 px-4 rounded-xl font-medium border-2 transition-all ${paymentStatus === 'UNPAID' ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                            >
                                {t.unpaidCredit}
                            </button>
                        </div>
                    </div>

                    {/* Payment Method */}
                    {paymentStatus === "PAID" && (
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">{t.paymentMethod}</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setPaymentMethod("CASH")}
                                    className={`py-2 px-4 rounded-xl font-medium border-2 transition-all ${paymentMethod === 'CASH' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                                >
                                    {t.cash}
                                </button>
                                <button
                                    onClick={() => setPaymentMethod("QR_CODE")}
                                    className={`py-2 px-4 rounded-xl font-medium border-2 transition-all ${paymentMethod === 'QR_CODE' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                                >
                                    {t.qrCodeBank}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Delivery Options */}
                    <div className="pt-2 border-t border-gray-100">
                        <label className="flex items-center gap-2 cursor-pointer mb-3">
                            <input
                                type="checkbox"
                                checked={requiresDelivery}
                                onChange={(e) => setRequiresDelivery(e.target.checked)}
                                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                            />
                            <span className="text-sm font-semibold text-gray-700">Requires Delivery</span>
                        </label>

                        {requiresDelivery && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Location / Notes <span className="text-red-500">*</span></label>
                                <textarea
                                    rows={2}
                                    placeholder="Enter address, maps link, or instructions"
                                    value={deliveryLocation}
                                    onChange={(e) => setDeliveryLocation(e.target.value)}
                                    className="w-full px-4 py-2 bg-gray-50 text-gray-700 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
                                />
                            </div>
                        )}
                    </div>

                    {/* Cash Received Input */}
                    {paymentStatus === "PAID" && paymentMethod === "CASH" && (
                        <>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">{t.cashReceived}</label>
                                <div className="relative">
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">៛</span>
                                    <CurrencyInput
                                        value={cashReceived}
                                        onChangeValue={(val) => setCashReceived(val ? val.toString() : "")}
                                        disabled={isSubmitting}
                                        className="w-full pl-4 pr-12 py-3 text-2xl font-bold text-gray-700 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all outline-none"
                                    />
                                </div>
                            </div>

                            {/* Change Due */}
                            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                <span className="text-gray-500 font-medium">{t.changeDue}</span>
                                <span className={`text-2xl font-bold ${changeDue > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                                    {formatCurrency(changeDue)}
                                </span>
                            </div>
                        </>
                    )}
                </div>

                {/* Actions */}
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="flex-1 py-3 px-4 rounded-xl border border-gray-300 text-gray-700 font-semibold bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                        {t.cancel}
                    </button>
                    <button
                        onClick={() => onConfirm({ 
                            paymentMethod, 
                            paymentStatus, 
                            customerId,
                            deliveryStatus: requiresDelivery ? "PENDING" : "NONE",
                            deliveryLocation
                        })}
                        disabled={isSubmitting || !isValid}
                        className="flex-[2] py-3 px-4 rounded-xl text-white font-semibold flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                {t.processing}
                            </>
                        ) : (
                            <>{t.confirmPayment}</>
                        )}
                    </button>
                </div>
                </>
                )}
            </div>
        </div>
    );
}
