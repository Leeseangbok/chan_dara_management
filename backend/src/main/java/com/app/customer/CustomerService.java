package com.app.customer;

import com.app.customer.dto.CustomerRequest;
import com.app.customer.dto.CustomerResponse;
import com.app.domain.entity.Customer;
import com.app.exception.ResourceNotFoundException;
import com.app.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CustomerService {

    private final CustomerRepository customerRepository;

    @Transactional(readOnly = true)
    public List<CustomerResponse> findAll() {
        return customerRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public CustomerResponse findById(UUID id) {
        Customer c = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found: " + id));
        return toResponse(c);
    }

    @Transactional
    public CustomerResponse create(CustomerRequest req) {
        Customer c = Customer.builder()
                .name(req.name())
                .phone(req.phone())
                .address(req.address())
                .notes(req.notes())
                .build();
        return toResponse(customerRepository.save(c));
    }

    @Transactional
    public CustomerResponse update(UUID id, CustomerRequest req) {
        Customer c = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found: " + id));
        c.setName(req.name());
        c.setPhone(req.phone());
        c.setAddress(req.address());
        c.setNotes(req.notes());
        return toResponse(customerRepository.save(c));
    }

    @Transactional
    public void delete(UUID id) {
        if (!customerRepository.existsById(id)) {
            throw new ResourceNotFoundException("Customer not found: " + id);
        }
        customerRepository.deleteById(id);
    }

    private CustomerResponse toResponse(Customer c) {
        return new CustomerResponse(
                c.getId(),
                c.getName(),
                c.getPhone(),
                c.getAddress(),
                c.getNotes(),
                c.getTotalUnpaid(),
                c.getCreatedAt()
        );
    }
}
