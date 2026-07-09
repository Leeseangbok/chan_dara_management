package com.app.exception;

public class ConcurrentStockModificationException extends RuntimeException {
    public ConcurrentStockModificationException(String message) {
        super(message);
    }
}
