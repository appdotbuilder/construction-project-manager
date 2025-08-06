
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreditCard, Plus, DollarSign, TrendingUp, Clock, CheckCircle, XCircle } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { CreatePaymentApplicationInput, PaymentApplication, PaymentStatus } from '../../../server/src/schema';

interface PaymentApplicationsProps {
  projectId: number;
}

export function PaymentApplications({ projectId }: PaymentApplicationsProps) {
  const [applications, setApplications] = useState<PaymentApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<CreatePaymentApplicationInput>({
    project_id: projectId,
    contractor_id: 1, // This would come from user context in real app
    term_number: 1,
    amount: 0,
    work_progress: 0
  });

  const loadPaymentApplications = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getPaymentApplications.query({ projectId });
      setApplications(result);
    } catch (error) {
      console.error('Failed to load payment applications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadPaymentApplications();
  }, [loadPaymentApplications]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await trpc.createPaymentApplication.mutate(formData);
      setApplications((prev: PaymentApplication[]) => [response, ...prev]);
      
      // Reset form and increment term number
      setFormData((prev: CreatePaymentApplicationInput) => ({
        ...prev,
        term_number: prev.term_number + 1,
        amount: 0,
        work_progress: 0
      }));
      setShowCreateDialog(false);
    } catch (error) {
      console.error('Failed to create payment application:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'paid': return 'bg-blue-100 text-blue-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'under_review': return 'bg-yellow-100 text-yellow-800';
      case 'submitted': return 'bg-purple-100 text-purple-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: PaymentStatus) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'paid': return <DollarSign className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      case 'under_review': return <Clock className="h-4 w-4" />;
      case 'submitted': return <TrendingUp className="h-4 w-4" />;
      case 'draft': return <Clock className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const calculateTotalAmount = () => {
    return applications.reduce((sum, app) => sum + app.amount, 0);
  };

  const calculateApprovedAmount = () => {
    return applications
      .filter((app) => app.status === 'approved' || app.status === 'paid')
      .reduce((sum, app) => sum + app.amount, 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">💰 Payment Applications</h2>
          <p className="text-gray-600">Manage termin payment applications and approvals</p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Application
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>💸 Create Payment Application</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="term_number">Term Number *</Label>
                <Input
                  id="term_number"
                  type="number"
                  value={formData.term_number}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreatePaymentApplicationInput) => ({
                      ...prev,
                      term_number: parseInt(e.target.value) || 1
                    }))
                  }
                  min="1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="amount">Amount (IDR) *</Label>
                <Input
                  id="amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreatePaymentApplicationInput) => ({
                      ...prev,
                      amount: parseFloat(e.target.value) || 0
                    }))
                  }
                  min="0"
                  step="1000000"
                  placeholder="e.g., 500000000"
                  required
                />
              </div>

              <div>
                <Label htmlFor="work_progress">Work Progress (%) *</Label>
                <div className="space-y-2">
                  <Input
                    id="work_progress"
                    type="number"
                    value={formData.work_progress}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreatePaymentApplicationInput) => ({
                        ...prev,
                        work_progress: parseFloat(e.target.value) || 0
                      }))
                    }
                    min="0"
                    max="100"
                    step="0.1"
                    required
                  />
                  <Progress value={formData.work_progress} className="h-2" />
                  <p className="text-xs text-gray-500">
                    Current work completion percentage
                  </p>
                </div>
              </div>

              <div>
                <Label>Contractor</Label>
                <Select
                  value={formData.contractor_id.toString()}
                  onValueChange={(value: string) =>
                    setFormData((prev: CreatePaymentApplicationInput) => ({
                      ...prev,
                      contractor_id: parseInt(value)
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">🏢 PT. Konstruksi Utama</SelectItem>
                    <SelectItem value="2">🏗️ CV. Bangun Mandiri</SelectItem>
                    <SelectItem value="3">⚡ PT. MEP Specialist</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg text-sm">
                <div className="flex justify-between">
                  <span>Requested Amount:</span>
                  <span className="font-medium">
                    Rp {formData.amount.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Progress:</span>
                  <span className="font-medium">{formData.work_progress}%</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
                  {isSubmitting ? '⏳ Creating...' : '💸 Create Application'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Total Applied</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              Rp {calculateTotalAmount().toLocaleString('id-ID')}
            </div>
            <p className="text-xs text-gray-500">{applications.length} applications</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Approved Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              Rp {calculateApprovedAmount().toLocaleString('id-ID')}
            </div>
            <p className="text-xs text-gray-500">
              {applications.filter(app => app.status === 'approved' || app.status === 'paid').length} approved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {applications.filter(app => app.status === 'submitted' || app.status === 'under_review').length}
            </div>
            <p className="text-xs text-gray-500">awaiting approval</p>
          </CardContent>
        </Card>
      </div>

      {/* Applications List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-16 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : applications.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <CreditCard className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Payment Applications
            </h3>
            <p className="text-gray-600 mb-4">
              Create your first payment application (termin) to request project funds.
            </p>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create First Application
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {applications.map((application: PaymentApplication) => (
            <Card key={application.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      💸 Termin {application.term_number}
                    </CardTitle>
                    <CardDescription>
                      Rp {application.amount.toLocaleString('id-ID')} • {application.work_progress}% Progress
                    </CardDescription>
                  </div>
                  
                  <Badge className={getStatusColor(application.status)}>
                    {getStatusIcon(application.status)}
                    <span className="ml-1">
                      {application.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Amount:</span>
                    <p className="font-medium text-lg">
                      Rp {application.amount.toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Work Progress:</span>
                    <div className="mt-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium">{application.work_progress}%</span>
                      </div>
                      <Progress value={application.work_progress} className="h-2" />
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center text-sm text-gray-600 border-t pt-3">
                  <div>
                    Created: {application.created_at.toLocaleDateString('id-ID')}
                    {application.submitted_at && (
                      <span className="ml-2">
                        • Submitted: {application.submitted_at.toLocaleDateString('id-ID')}
                      </span>
                    )}
                  </div>
                  
                  {application.status === 'draft' && (
                    <Button size="sm" variant="outline">
                      📝 Edit
                    </Button>
                  )}
                  
                  {application.status === 'approved' && (
                    <Button size="sm" className="bg-green-600 hover:bg-green-700">
                      ✅ Generate Invoice
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
