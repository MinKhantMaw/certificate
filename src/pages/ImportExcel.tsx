import { useState, ChangeEvent } from 'react';
import * as XLSX from 'xlsx';
import { Upload, AlertCircle, CheckCircle2, ChevronRight, XCircle } from 'lucide-react';
import { ImportedRow, Certificate } from '../types';
import { storage } from '../services/storage';
import { generateCertificateNumber } from '../utils';

type ImportStep = 'UPLOAD' | 'PREVIEW' | 'RESULT';

export function ImportExcel() {
  const [step, setStep] = useState<ImportStep>('UPLOAD');
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<ImportedRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null);

  const REQUIRED_COLS = ['recipient_name', 'certificate_title', 'course_name', 'issue_date', 'organization', 'certificate_type', 'email'];

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    parseExcel(selectedFile);
  };

  const parseExcel = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheet = workbook.SheetNames[0];
        const rawRows = XLSX.utils.sheet_to_json<any>(workbook.Sheets[firstSheet]);
        
        const validatedRows = rawRows.map(row => {
          const errors: string[] = [];
          
          REQUIRED_COLS.forEach(col => {
            if (!row[col] || String(row[col]).trim() === '') {
              errors.push(`Missing ${col}`);
            }
          });

          return {
            recipient_name: row.recipient_name || '',
            certificate_title: row.certificate_title || '',
            course_name: row.course_name || '',
            issue_date: row.issue_date || '',
            organization: row.organization || '',
            certificate_type: row.certificate_type || '',
            email: row.email || '',
            isValid: errors.length === 0,
            errors
          };
        });

        setRows(validatedRows);
        setStep('PREVIEW');
      } catch (err) {
        alert('Failed to parse Excel file. Make sure it is a valid .xlsx or .xls file.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const confirmImport = () => {
    setIsProcessing(true);
    
    setTimeout(() => {
      const validRows = rows.filter(r => r.isValid);
      let startIndex = storage.getNextCertificateIndex();
      
      const newCertificates: Certificate[] = validRows.map(row => {
        const certNumber = generateCertificateNumber(startIndex++);
        const verificationToken = crypto.randomUUID();
        const origin = window.location.origin;
        const verificationUrl = `${origin}/verify/${verificationToken}`;

        return {
          id: certNumber,
          certificateNumber: certNumber,
          verificationToken,
          verificationUrl,
          recipientName: row.recipient_name,
          certificateTitle: row.certificate_title,
          courseName: row.course_name,
          issueDate: String(row.issue_date),
          organization: row.organization,
          certificateType: row.certificate_type,
          email: row.email,
          status: 'VALID',
          createdAt: new Date().toISOString(),
        };
      });

      storage.saveCertificates(newCertificates);
      
      // Save Import Record
      storage.saveImport({
        id: crypto.randomUUID(),
        fileName: file?.name || 'Unknown',
        importDate: new Date().toISOString(),
        totalRows: rows.length,
        successfulRows: validRows.length,
        failedRows: rows.length - validRows.length,
        status: validRows.length > 0 ? (validRows.length === rows.length ? 'COMPLETED' : 'PARTIAL') : 'FAILED'
      });

      setImportResult({ success: validRows.length, failed: rows.length - validRows.length });
      setIsProcessing(false);
      setStep('RESULT');
    }, 1000); // Simulate processing delay
  };

  const resetImport = () => {
    setStep('UPLOAD');
    setFile(null);
    setRows([]);
    setImportResult(null);
  };

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-center space-x-4 py-4">
        <StepIndicator active={step === 'UPLOAD'} completed={step !== 'UPLOAD'} label="Upload" />
        <ChevronRight className="w-5 h-5 text-gray-400" />
        <StepIndicator active={step === 'PREVIEW'} completed={step === 'RESULT'} label="Preview & Validate" />
        <ChevronRight className="w-5 h-5 text-gray-400" />
        <StepIndicator active={step === 'RESULT'} completed={false} label="Result" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[400px]">
        {step === 'UPLOAD' && (
          <div className="p-12 flex flex-col items-center justify-center text-center h-full">
            <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6">
              <Upload className="w-10 h-10" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Upload Excel File</h2>
            <p className="text-gray-500 mb-8 max-w-md">
              Upload your .xlsx or .xls file containing certificate recipient data. 
              Required columns: recipient_name, certificate_title, course_name, issue_date, organization, certificate_type, email.
            </p>
            <label className="cursor-pointer bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm inline-flex items-center">
              <Upload className="w-5 h-5 mr-2" />
              Select File
              <input 
                type="file" 
                accept=".xlsx, .xls" 
                className="hidden" 
                onChange={handleFileUpload}
              />
            </label>
          </div>
        )}

        {step === 'PREVIEW' && (
          <div className="flex flex-col h-full">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="font-semibold text-gray-900">Preview Data</h3>
                <p className="text-sm text-gray-500">File: {file?.name}</p>
              </div>
              <div className="flex space-x-3">
                <button 
                  onClick={resetImport}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmImport}
                  disabled={isProcessing || rows.filter(r => r.isValid).length === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isProcessing ? 'Generating...' : `Import ${rows.filter(r => r.isValid).length} Valid Rows`}
                </button>
              </div>
            </div>
            
            <div className="p-4 grid grid-cols-3 gap-4 border-b border-gray-200 bg-white">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-500">Total Rows</p>
                <p className="text-2xl font-bold text-gray-900">{rows.length}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-sm text-green-600">Valid Rows</p>
                <p className="text-2xl font-bold text-green-700">{rows.filter(r => r.isValid).length}</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <p className="text-sm text-red-600">Invalid Rows</p>
                <p className="text-2xl font-bold text-red-700">{rows.filter(r => !r.isValid).length}</p>
              </div>
            </div>

            <div className="overflow-x-auto p-4 flex-1">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recipient</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Errors</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {rows.map((row, idx) => (
                    <tr key={idx} className={row.isValid ? '' : 'bg-red-50'}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {row.isValid ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-red-500" />
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{row.recipient_name}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{row.course_name}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{row.email}</td>
                      <td className="px-4 py-3 text-sm text-red-600">
                        {row.errors?.join(', ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {step === 'RESULT' && (
          <div className="p-12 flex flex-col items-center justify-center text-center h-full">
            <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Import Successful!</h2>
            <p className="text-gray-600 mb-8 max-w-md">
              Successfully generated <strong>{importResult?.success}</strong> certificates.
              {importResult?.failed ? ` Skipped ${importResult.failed} invalid rows.` : ''}
            </p>
            <div className="flex space-x-4">
              <button 
                onClick={resetImport}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
              >
                Import Another
              </button>
              <button 
                onClick={() => window.location.href = '/certificates'}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                View Certificates
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StepIndicator({ active, completed, label }: { active: boolean, completed: boolean, label: string }) {
  return (
    <div className={`flex items-center space-x-2 ${active ? 'text-blue-600' : (completed ? 'text-green-600' : 'text-gray-400')}`}>
      {completed ? (
        <CheckCircle2 className="w-6 h-6" />
      ) : (
        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold ${active ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}>
          <div className={`w-2 h-2 rounded-full ${active ? 'bg-blue-600' : 'bg-transparent'}`} />
        </div>
      )}
      <span className="font-medium text-sm">{label}</span>
    </div>
  );
}
