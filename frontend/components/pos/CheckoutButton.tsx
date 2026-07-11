"use client";

interface CheckoutButtonProps {
    disabled: boolean;
    isSubmitting: boolean;
    onCheckout: () => void;
}

export function CheckoutButton({ disabled, isSubmitting, onCheckout }: CheckoutButtonProps) {
    return (
        <button
            onClick={onCheckout}
            disabled={disabled || isSubmitting}
            className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold
                 hover:bg-blue-700 active:scale-[0.99] transition
                 disabled:opacity-40 disabled:cursor-not-allowed"
        >
            {isSubmitting ? "Processing…" : "Complete Sale"}
        </button>
    );
}