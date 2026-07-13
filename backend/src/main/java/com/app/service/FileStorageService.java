package com.app.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;

@Slf4j
@Service
public class FileStorageService {

    private final RestClient restClient;
    private final String supabaseUrl;
    private final String supabaseBucket;
    private final String supabaseKey;

    public FileStorageService(
            @Value("${app.supabase.url}") String supabaseUrl,
            @Value("${app.supabase.key}") String supabaseKey,
            @Value("${app.supabase.bucket:product-images}") String supabaseBucket) {

        this.supabaseUrl = supabaseUrl;
        this.supabaseKey = supabaseKey;
        this.supabaseBucket = supabaseBucket;
        this.restClient = RestClient.create();

        log.info("File storage configured for Supabase bucket: {}", this.supabaseBucket);
    }

    /**
     * Uploads the file to Supabase Storage and returns the public URL path.
     */
    public String storeProductImage(UUID productId, MultipartFile file) throws IOException {
        String originalFilename = java.util.Objects.requireNonNullElse(file.getOriginalFilename(), "file");
        String original = StringUtils.cleanPath(originalFilename);
        String ext = StringUtils.getFilenameExtension(original);
        String filename = productId + (ext != null && !ext.isBlank() ? "." + ext.toLowerCase() : ".jpg");

        // Supabase upload endpoint: POST /storage/v1/object/{bucket}/{filename}
        String uploadUrl = String.format("%s/storage/v1/object/%s/%s", supabaseUrl, supabaseBucket, filename);

        String contentType = file.getContentType();
        if (contentType == null) {
            contentType = MediaType.APPLICATION_OCTET_STREAM_VALUE;
        }

        log.info("Uploading file to Supabase: {}", filename);

        restClient.post()
                .uri(uploadUrl)
                .header("Authorization", "Bearer " + supabaseKey)
                .header("x-upsert", "true") // Overwrite if exists
                .contentType(MediaType.parseMediaType(contentType))
                .body(file.getBytes())
                .retrieve()
                .toBodilessEntity(); // Throws exception on 4xx/5xx

        // Construct public URL
        return String.format("%s/storage/v1/object/public/%s/%s", supabaseUrl, supabaseBucket, filename);
    }
}
