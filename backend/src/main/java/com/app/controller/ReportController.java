package com.app.controller;

import com.app.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;

@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/comprehensive/excel")
    public ResponseEntity<byte[]> exportComprehensiveExcel(@RequestParam(defaultValue = "day") String period) {
        ZoneId zone = ZoneId.of("Asia/Phnom_Penh");
        ZonedDateTime now = ZonedDateTime.now(zone);
        
        Instant start;
        Instant end;
        String title;
        String filenamePrefix;

        switch (period.toLowerCase()) {
            case "month":
                ZonedDateTime startOfMonth = now.with(TemporalAdjusters.firstDayOfMonth()).truncatedTo(ChronoUnit.DAYS);
                start = startOfMonth.toInstant();
                end = startOfMonth.plusMonths(1).minusNanos(1).toInstant();
                title = "Monthly Report (" + startOfMonth.getMonth().name() + " " + startOfMonth.getYear() + ")";
                filenamePrefix = "Comprehensive_Monthly_Report";
                break;
            case "year":
                ZonedDateTime startOfYear = now.with(TemporalAdjusters.firstDayOfYear()).truncatedTo(ChronoUnit.DAYS);
                start = startOfYear.toInstant();
                end = startOfYear.plusYears(1).minusNanos(1).toInstant();
                title = "Yearly Report (" + startOfYear.getYear() + ")";
                filenamePrefix = "Comprehensive_Yearly_Report";
                break;
            case "day":
            default:
                ZonedDateTime startOfDay = now.truncatedTo(ChronoUnit.DAYS);
                start = startOfDay.toInstant();
                end = startOfDay.plus(1, ChronoUnit.DAYS).minusNanos(1).toInstant();
                title = "Daily Report (" + startOfDay.toLocalDate().toString() + ")";
                filenamePrefix = "Comprehensive_Daily_Report";
                break;
        }

        try {
            byte[] excelData = reportService.generateComprehensiveExcelReport(start, end, title);
            
            String filename = filenamePrefix + "_" + now.toLocalDate().toString() + ".xlsx";

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
                    .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                    .body(excelData);
                    
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
