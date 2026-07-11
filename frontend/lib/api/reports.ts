import { apiClient } from './client';

export const reportApi = {
  exportComprehensiveExcel: async (period: 'day' | 'month' | 'year') => {
    // We need to fetch the blob and trigger a download manually
    const response = await apiClient.get(`/api/v1/reports/comprehensive/excel?period=${period}`, {
      responseType: 'blob',
    });

    // Create a URL for the blob
    const url = window.URL.createObjectURL(new Blob([response.data]));
    
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = url;
    
    // Attempt to extract filename from content-disposition header if available
    let filename = `Transactions_${period}_Report.xlsx`;
    const disposition = response.headers['content-disposition'];
    if (disposition && disposition.indexOf('filename=') !== -1) {
      const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
      const matches = filenameRegex.exec(disposition);
      if (matches != null && matches[1]) { 
        filename = matches[1].replace(/['"]/g, '');
      }
    }

    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
};
