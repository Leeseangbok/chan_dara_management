package com.app.product;

import com.app.category.CategoryService;
import com.app.domain.entity.Category;
import com.app.domain.entity.Product;
import com.app.exception.ResourceNotFoundException;
import com.app.repository.CategoryRepository;
import com.app.repository.ProductRepository;
import com.app.service.ActivityLogService;
import com.app.service.FileStorageService;
import com.app.service.dto.CreateProductRequest;
import com.app.service.dto.ProductResponse;
import com.app.service.dto.UpdateProductRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ActivityLogService activityLogService;
    private final CategoryService categoryService;
    private final FileStorageService fileStorageService;
    private final com.app.service.InventoryService inventoryService;

    @Transactional(readOnly = true)
    public List<ProductResponse> findAll() {
        return productRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public String generateSku(UUID categoryId) {
        String prefix = "Prod";
        if (categoryId != null) {
            Category category = categoryRepository.findById(categoryId).orElse(null);
            if (category != null && category.getName() != null && !category.getName().isEmpty()) {
                String rawName = category.getName().trim();
                String[] words = rawName.split("\\s+");
                String lastWord = words[words.length - 1];
                String cleaned = lastWord.replaceAll("[^a-zA-Z0-9]", "");
                if (!cleaned.isEmpty()) {
                    cleaned = cleaned.substring(0, 1).toUpperCase() + cleaned.substring(1).toLowerCase();
                    prefix = "Prod-" + cleaned;
                }
            }
        }
        
        String prefixDash = prefix + "-";
        int nextNumber = 1;
        var topProduct = productRepository.findTopBySkuStartingWithOrderBySkuDesc(prefixDash);
        
        if (topProduct.isPresent()) {
            String currentSku = topProduct.get().getSku();
            try {
                String numStr = currentSku.substring(prefixDash.length());
                nextNumber = Integer.parseInt(numStr) + 1;
            } catch (Exception ignored) {
            }
        }
        return String.format("%s-%04d", prefix, nextNumber);
    }


    @Transactional(readOnly = true)
    public ProductResponse findById(UUID id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + id));
        return toResponse(product);
    }

    @Transactional
    public ProductResponse create(CreateProductRequest req) {
        if (productRepository.existsBySku(req.sku())) {
            throw new DataIntegrityViolationException("SKU already exists: " + req.sku());
        }
        Category category = resolveCategory(req.categoryId());
        Product parent = null;
        if (req.parentProductId() != null) {
            parent = productRepository.findById(req.parentProductId()).orElse(null);
        }

        Product product = Product.builder()
                .sku(req.sku())
                .name(req.name())
                .nameKh(req.nameKh())
                .description(req.description())
                .category(category)
                .price(req.price())
                .costPrice(req.costPrice())
                .costPriceDollar(req.costPriceDollar())
                .exchangeRate(req.exchangeRate())
                .deliveryPrice(req.deliveryPrice())
                .stockQuantity(req.stockQuantity())
                .parentProduct(parent)
                .piecesPerParent(req.piecesPerParent())
                .build();
        
        Product saved = productRepository.save(product);
        
        activityLogService.logActivity(null, "CREATE", "PRODUCT", saved.getId().toString(), "Created product: " + saved.getName());
        
        return toResponse(saved);
    }

    @Transactional
    public ProductResponse update(UUID id, UpdateProductRequest req) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + id));
        product.setName(req.name());
        product.setNameKh(req.nameKh());
        product.setDescription(req.description());
        product.setCategory(resolveCategory(req.categoryId()));
        product.setPrice(req.price());
        product.setCostPrice(req.costPrice());
        product.setCostPriceDollar(req.costPriceDollar());
        product.setExchangeRate(req.exchangeRate());
        product.setDeliveryPrice(req.deliveryPrice());
        product.setStockQuantity(req.stockQuantity());
        
        if (req.parentProductId() != null) {
            Product parent = productRepository.findById(req.parentProductId()).orElse(null);
            product.setParentProduct(parent);
        } else {
            product.setParentProduct(null);
        }
        product.setPiecesPerParent(req.piecesPerParent());
        
        Product saved = productRepository.save(product);
        
        activityLogService.logActivity(null, "UPDATE", "PRODUCT", saved.getId().toString(), "Updated product: " + saved.getName());
        
        return toResponse(saved);
    }

    @Transactional
    public ProductResponse uploadImage(UUID id, MultipartFile file) throws IOException {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + id));
        String url = fileStorageService.storeProductImage(id, file);
        product.setImageUrl(url);
        return toResponse(productRepository.save(product));
    }

    @Transactional
    public void delete(UUID id) {
        if (!productRepository.existsById(id)) {
            throw new ResourceNotFoundException("Product not found: " + id);
        }
        productRepository.deleteById(id);
        
        activityLogService.logActivity(null, "DELETE", "PRODUCT", id.toString(), "Deleted product");
    }

    @Transactional
    public void unpack(UUID childProductId, int amountToUnpack, com.app.domain.entity.User actor) {
        Product childProduct = productRepository.findById(childProductId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + childProductId));
        inventoryService.unpack(childProduct, actor, amountToUnpack);
        activityLogService.logActivity(actor, "UNPACK", "PRODUCT", childProductId.toString(), "Unpacked " + amountToUnpack + " parent bags into smaller bags");
    }

    private Category resolveCategory(UUID categoryId) {
        if (categoryId == null) return null;
        return categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found: " + categoryId));
    }

    private ProductResponse toResponse(Product p) {
        return new ProductResponse(
                p.getId(), p.getSku(), p.getName(), p.getNameKh(),
                p.getDescription(), p.getImageUrl(),
                p.getCategory() != null ? categoryService.toResponse(p.getCategory()) : null,
                p.getPrice(), p.getCostPrice(),
                p.getCostPriceDollar(), p.getExchangeRate(), p.getDeliveryPrice(),
                p.getStockQuantity(),
                p.getParentProduct() != null ? p.getParentProduct().getId() : null,
                p.getPiecesPerParent()
        );
    }
}
