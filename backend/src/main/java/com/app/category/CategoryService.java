package com.app.category;

import com.app.domain.entity.Category;
import com.app.exception.ResourceNotFoundException;
import com.app.repository.CategoryRepository;
import com.app.service.dto.CategoryResponse;
import com.app.service.dto.CreateCategoryRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;

    @Transactional(readOnly = true)
    public List<CategoryResponse> findAll() {
        return categoryRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional
    public CategoryResponse create(CreateCategoryRequest req) {
        if (categoryRepository.existsByName(req.name())) {
            throw new DataIntegrityViolationException("Category name already exists: " + req.name());
        }
        Category cat = Category.builder()
                .name(req.name())
                .nameKh(req.nameKh())
                .build();
        return toResponse(categoryRepository.save(cat));
    }

    @Transactional
    public CategoryResponse update(UUID id, CreateCategoryRequest req) {
        Category cat = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found: " + id));
        cat.setName(req.name());
        cat.setNameKh(req.nameKh());
        return toResponse(categoryRepository.save(cat));
    }

    @Transactional
    public void delete(UUID id) {
        if (!categoryRepository.existsById(id)) {
            throw new ResourceNotFoundException("Category not found: " + id);
        }
        categoryRepository.deleteById(id);
    }

    public CategoryResponse toResponse(Category c) {
        return new CategoryResponse(c.getId(), c.getName(), c.getNameKh());
    }
}
