
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Upload, Download, Eye, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { CreateDocumentInput, Document, ApproveDocumentInput, DocumentType, ApprovalStatus } from '../../../server/src/schema';

interface DocumentManagementProps {
  projectId: number;
}

export function DocumentManagement({ projectId }: DocumentManagementProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Upload form state
  const [uploadData, setUploadData] = useState<CreateDocumentInput>({
    project_id: projectId,
    title: '',
    type: 'drawing' as DocumentType,
    file_url: '',
    version: '1.0'
  });

  // Approval form state
  const [approvalData, setApprovalData] = useState<ApproveDocumentInput>({
    document_id: 0,
    status: 'approved' as ApprovalStatus,
    comments: null
  });

  const loadDocuments = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getDocuments.query({ projectId });
      setDocuments(result);
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await trpc.createDocument.mutate(uploadData);
      setDocuments((prev: Document[]) => [response, ...prev]);
      
      // Reset form
      setUploadData({
        project_id: projectId,
        title: '',
        type: 'drawing' as DocumentType,
        file_url: '',
        version: '1.0'
      });
      setShowUploadDialog(false);
    } catch (error) {
      console.error('Failed to upload document:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocument) return;

    setIsSubmitting(true);
    try {
      await trpc.approveDocument.mutate({
        ...approvalData,
        document_id: selectedDocument.id
      });
      
      // Update document in state
      setDocuments((prev: Document[]) =>
        prev.map((doc: Document) =>
          doc.id === selectedDocument.id
            ? { ...doc, approval_status: approvalData.status }
            : doc
        )
      );
      
      setShowApprovalDialog(false);
      setSelectedDocument(null);
    } catch (error) {
      console.error('Failed to process approval:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDocumentTypeIcon = (type: DocumentType) => {
    switch (type) {
      case 'drawing': return '📐';
      case 'work_method': return '🔧';
      case 'material_spec': return '📦';
      case 'permit': return '📝';
      case 'report': return '📊';
      default: return '📄';
    }
  };

  const getDocumentTypeName = (type: DocumentType) => {
    switch (type) {
      case 'drawing': return 'Drawing';
      case 'work_method': return 'Work Method';
      case 'material_spec': return 'Material Spec';
      case 'permit': return 'Permit';
      case 'report': return 'Report';
      default: return 'Other';
    }
  };

  const getApprovalStatusColor = (status: ApprovalStatus) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'revision_required': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getApprovalStatusIcon = (status: ApprovalStatus) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      case 'revision_required': return <AlertCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">📁 Document Management</h2>
          <p className="text-gray-600">Upload, manage and approve project documents</p>
        </div>
        
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Upload className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>📤 Upload Document</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <Label htmlFor="title">Document Title *</Label>
                <Input
                  id="title"
                  value={uploadData.title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setUploadData((prev: CreateDocumentInput) => ({
                      ...prev,
                      title: e.target.value
                    }))
                  }
                  placeholder="e.g., Structural Drawing Rev.1"
                  required
                />
              </div>

              <div>
                <Label>Document Type *</Label>
                <Select
                  value={uploadData.type || 'drawing'}
                  onValueChange={(value: DocumentType) =>
                    setUploadData((prev: CreateDocumentInput) => ({
                      ...prev,
                      type: value
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="drawing">📐 Drawing</SelectItem>
                    <SelectItem value="work_method">🔧 Work Method</SelectItem>
                    <SelectItem value="material_spec">📦 Material Specification</SelectItem>
                    <SelectItem value="permit">📝 Permit</SelectItem>
                    <SelectItem value="report">📊 Report</SelectItem>
                    <SelectItem value="other">📄 Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="version">Version *</Label>
                <Input
                  id="version"
                  value={uploadData.version}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setUploadData((prev: CreateDocumentInput) => ({
                      ...prev,
                      version: e.target.value
                    }))
                  }
                  placeholder="e.g., 1.0, Rev.A"
                  required
                />
              </div>

              <div>
                <Label htmlFor="file_url">File Upload *</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 mb-2">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-gray-400">
                    PDF, DWG, DOC files up to 50MB
                  </p>
                  <Input
                    id="file_url"
                    type="url"
                    value={uploadData.file_url}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setUploadData((prev: CreateDocumentInput) => ({
                        ...prev,
                        file_url: e.target.value
                      }))
                    }
                    placeholder="File URL (temporary)"
                    className="mt-3"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowUploadDialog(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
                  {isSubmitting ? '⏳ Uploading...' : '📤 Upload'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Document Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Select defaultValue="all">
              <SelectTrigger>
                <SelectValue placeholder="Document Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="drawing">📐 Drawing</SelectItem>
                <SelectItem value="work_method">🔧 Work Method</SelectItem>
                <SelectItem value="material_spec">📦 Material Spec</SelectItem>
                <SelectItem value="permit">📝 Permit</SelectItem>
                <SelectItem value="report">📊 Report</SelectItem>
              </SelectContent>
            </Select>

            <Select defaultValue="all">
              <SelectTrigger>
                <SelectValue placeholder="Approval Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">⏳ Pending</SelectItem>
                <SelectItem value="approved">✅ Approved</SelectItem>
                <SelectItem value="rejected">❌ Rejected</SelectItem>
                <SelectItem value="revision_required">⚠️ Revision Required</SelectItem>
              </SelectContent>
            </Select>

            <Input placeholder="Search documents..." />
            <Button variant="outline">🔍 Filter</Button>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : documents.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Documents Uploaded
            </h3>
            <p className="text-gray-600 mb-4">
              Upload your first project document to get started with document management.
            </p>
            <Button
              onClick={() => setShowUploadDialog(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload First Document
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {documents.map((document: Document) => (
            <Card key={document.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">
                      {getDocumentTypeIcon(document.type)}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{document.title}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <span>{getDocumentTypeName(document.type)}</span>
                        <span>•</span>
                        <span>Version {document.version}</span>
                      </CardDescription>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge className={getApprovalStatusColor(document.approval_status)}>
                      {getApprovalStatusIcon(document.approval_status)}
                      <span className="ml-1">
                        {document.approval_status.replace('_', ' ').toUpperCase()}
                      </span>
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    Uploaded: {document.created_at.toLocaleDateString('id-ID')}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button size="sm" variant="outline">
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                    {document.approval_status === 'pending' && (
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => {
                          setSelectedDocument(document);
                          setApprovalData({
                            document_id: document.id,
                            status: 'approved' as ApprovalStatus,
                            comments: null
                          });
                          setShowApprovalDialog(true);
                        }}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Review
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              ✅ Review Document: {selectedDocument?.title}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleApproval} className="space-y-4">
            <div>
              <Label>Approval Decision *</Label>
              <Select
                value={approvalData.status || 'approved'}
                onValueChange={(value: ApprovalStatus) =>
                  setApprovalData((prev: ApproveDocumentInput) => ({
                    ...prev,
                    status: value
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved">✅ Approved</SelectItem>
                  <SelectItem value="rejected">❌ Rejected</SelectItem>
                  <SelectItem value="revision_required">⚠️ Revision Required</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="comments">Comments</Label>
              <Textarea
                id="comments"
                value={approvalData.comments || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setApprovalData((prev: ApproveDocumentInput) => ({
                    ...prev,
                    comments: e.target.value || null
                  }))
                }
                placeholder="Add your review comments..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowApprovalDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
                {isSubmitting ? '⏳ Submitting...' : '✅ Submit Review'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
