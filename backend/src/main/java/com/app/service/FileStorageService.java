package com.app.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.UUID;

@Slf4j
@Service
public class FileStorageService {

    private final Path uploadRoot;

    public FileStorageService(@Value("${app.upload.dir:uploads}") String uploadDir) {
        this.uploadRoot = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.uploadRoot.resolve("products"));
        } catch (IOException e) {
            throw new RuntimeException("Could not create upload directory: " + this.uploadRoot, e);
        }
        log.info("File storage initialised at: {}", this.uploadRoot);
    }

    /**
     * Stores the file as products/<productId>.<ext> and returns the public URL
     * path.
     */
    public String storeProductImage(UUID productId, MultipartFile file) throws IOException {
        String original = StringUtils
                .cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "file");
        String ext = StringUtils.getFilenameExtension(original);
        String filename = productId + (ext != null && !ext.isBlank() ? "." + ext.toLowerCase() : ".jpg");

        Path target = uploadRoot.resolve("products").resolve(filename);
        Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

        return "/uploads/products/" + filename;
    }
}
