package com.app.customer;

import com.app.customer.dto.CustomerRequest;
import com.app.customer.dto.CustomerResponse;
import com.app.domain.entity.Customer;
import com.app.exception.ResourceNotFoundException;
import com.app.repository.CustomerRepository;
import com.app.service.ActivityLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final ActivityLogService activityLogService;

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
        Customer saved = customerRepository.save(c);

        // We'll log it as a System action if user isn't passed, or we can just pass
        // null and let it be "System"
        activityLogService.logActivity(null, "CREATE", "CUSTOMER", saved.getId().toString(),
                "Created customer: " + saved.getName());

        return toResponse(saved);
    }

    @Transactional
    public CustomerResponse update(UUID id, CustomerRequest req) {
        Customer c = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found: " + id));
        c.setName(req.name());
        c.setPhone(req.phone());
        c.setAddress(req.address());
        c.setNotes(req.notes());
        Customer saved = customerRepository.save(c);

        activityLogService.logActivity(null, "UPDATE", "CUSTOMER", saved.getId().toString(),
                "Updated customer: " + saved.getName());

        return toResponse(saved);
    }

    @Transactional
    public void delete(UUID id) {
        if (!customerRepository.existsById(id)) {
            throw new ResourceNotFoundException("Customer not found: " + id);
        }
        customerRepository.deleteById(id);

        activityLogService.logActivity(null, "DELETE", "CUSTOMER", id.toString(), "Deleted customer");
    }

    private CustomerResponse toResponse(Customer c) {
        return new CustomerResponse(
                c.getId(),
                c.getName(),
                c.getPhone(),
                c.getAddress(),
                c.getNotes(),
                c.getTotalUnpaid(),
                c.getCreatedAt());
    }
}
