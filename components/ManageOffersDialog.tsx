"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Percent, DollarSign, Truck, Plus, Pencil, Trash2, Tag } from "lucide-react";

interface Coupon {
  id: string;
  code: string;
  description: string;
  discount_type: 'percentage' | 'flat' | 'free_shipping' | 'buy_x_get_y';
  discount_value: number;
  min_order_value: number;
  max_discount: number | null;
  usage_limit: number | null;
  usage_count: number;
  per_user_limit: number | null;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
}

interface FormData {
  code: string;
  description: string;
  discount_type: 'percentage' | 'flat' | 'free_shipping' | 'buy_x_get_y';
  discount_value: number;
  min_order_value: number;
  max_discount: number | null;
  usage_limit: number | null;
  per_user_limit: number | null;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
}

export default function ManageOffersDialog() {
  const [open, setOpen] = useState(false);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState<FormData>({
    code: '',
    description: '',
    discount_type: 'percentage',
    discount_value: 0,
    min_order_value: 0,
    max_discount: null,
    usage_limit: null,
    per_user_limit: null,
    valid_from: new Date().toISOString().split('T')[0],
    valid_until: '',
    is_active: true,
  });

  // Fetch coupons when dialog opens
  useEffect(() => {
    if (open) {
      fetchCoupons();
    }
  }, [open]);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/coupons');
      const data = await response.json();
      
      if (response.ok) {
        setCoupons(data.coupons || []);
      } else {
        toast.error(data.error || 'Failed to fetch coupons');
      }
    } catch (error) {
      console.error('Error fetching coupons:', error);
      toast.error('Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.code.trim()) {
      toast.error('Coupon code is required');
      return;
    }
    
    if (formData.discount_value <= 0) {
      toast.error('Discount value must be greater than 0');
      return;
    }
    
    if (formData.discount_type === 'percentage' && formData.discount_value > 100) {
      toast.error('Percentage discount cannot exceed 100%');
      return;
    }

    try {
      setLoading(true);
      
      const url = editingCoupon ? '/api/coupons' : '/api/coupons';
      const method = editingCoupon ? 'PUT' : 'POST';
      const body = editingCoupon 
        ? { id: editingCoupon.id, ...formData }
        : formData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(editingCoupon ? 'Coupon updated successfully' : 'Coupon created successfully');
        resetForm();
        fetchCoupons();
      } else {
        toast.error(data.error || 'Failed to save coupon');
      }
    } catch (error) {
      console.error('Error saving coupon:', error);
      toast.error('Failed to save coupon');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      description: coupon.description,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      min_order_value: coupon.min_order_value,
      max_discount: coupon.max_discount,
      usage_limit: coupon.usage_limit,
      per_user_limit: coupon.per_user_limit,
      valid_from: coupon.valid_from.split('T')[0],
      valid_until: coupon.valid_until ? coupon.valid_until.split('T')[0] : '',
      is_active: coupon.is_active,
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/coupons?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Coupon deleted successfully');
        fetchCoupons();
      } else {
        toast.error(data.error || 'Failed to delete coupon');
      }
    } catch (error) {
      console.error('Error deleting coupon:', error);
      toast.error('Failed to delete coupon');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingCoupon(null);
    setFormData({
      code: '',
      description: '',
      discount_type: 'percentage',
      discount_value: 0,
      min_order_value: 0,
      max_discount: null,
      usage_limit: null,
      per_user_limit: null,
      valid_from: new Date().toISOString().split('T')[0],
      valid_until: '',
      is_active: true,
    });
  };

  const getDiscountIcon = (type: string) => {
    switch (type) {
      case 'percentage': return <Percent className="h-4 w-4" />;
      case 'flat': return <DollarSign className="h-4 w-4" />;
      case 'free_shipping': return <Truck className="h-4 w-4" />;
      case 'buy_x_get_y': return <Plus className="h-4 w-4" />;
      default: return <Tag className="h-4 w-4" />;
    }
  };

  const getDiscountDisplay = (coupon: Coupon) => {
    if (coupon.discount_type === 'percentage') {
      return `${coupon.discount_value}% off`;
    } else if (coupon.discount_type === 'flat') {
      return `₹${coupon.discount_value} off`;
    } else if (coupon.discount_type === 'buy_x_get_y') {
      return `Buy ${coupon.discount_value} Get ${coupon.max_discount || 1} Free`;
    } else {
      return 'Free Shipping';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Tag className="h-4 w-4" />
          Manage Offers
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Manage Coupon Codes</DialogTitle>
          <DialogDescription>
            Create, edit, and manage promotional coupon codes for your franchise. Set discounts, usage limits, and validity periods.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form Section */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold text-lg mb-4">
              {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="code">Coupon Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g., WELCOME10"
                  maxLength={50}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe this offer..."
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="discount_type">Discount Type *</Label>
                <Select 
                  value={formData.discount_type} 
                  onValueChange={(v: any) => setFormData({ ...formData, discount_type: v })}
                >
                  <SelectTrigger id="discount_type">
                    <SelectValue placeholder="Select discount type" />
                  </SelectTrigger>
                  <SelectContent position="popper" sideOffset={5}>
                    <SelectItem value="percentage">Percentage Discount (e.g., 10% off)</SelectItem>
                    <SelectItem value="flat">Flat Amount Discount (e.g., ₹500 off)</SelectItem>
                    <SelectItem value="buy_x_get_y">Buy X Get Y Free (e.g., Buy 2 Get 1)</SelectItem>
                    <SelectItem value="free_shipping">Free Shipping</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="discount_value">
                    {formData.discount_type === 'percentage' ? 'Percentage (%)' : 
                     formData.discount_type === 'buy_x_get_y' ? 'Buy Quantity (X)' : 'Amount (₹)'}
                  </Label>
                  <Input
                    id="discount_value"
                    type="number"
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) || 0 })}
                    min={0}
                    max={formData.discount_type === 'percentage' ? 100 : undefined}
                    step="0.01"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="min_order_value">Min Order Value (₹)</Label>
                  <Input
                    id="min_order_value"
                    type="number"
                    value={formData.min_order_value}
                    onChange={(e) => setFormData({ ...formData, min_order_value: parseFloat(e.target.value) || 0 })}
                    min={0}
                    step="0.01"
                  />
                </div>
              </div>

              {(formData.discount_type === 'percentage' || formData.discount_type === 'buy_x_get_y') && (
                <div>
                  <Label htmlFor="max_discount">
                    {formData.discount_type === 'percentage' ? 'Max Discount Cap (₹)' : 'Get Quantity (Y) Free'}
                  </Label>
                  <Input
                    id="max_discount"
                    type="number"
                    value={formData.max_discount || ''}
                    onChange={(e) => setFormData({ ...formData, max_discount: e.target.value ? parseFloat(e.target.value) : null })}
                    min={0}
                    step={formData.discount_type === 'percentage' ? '0.01' : '1'}
                    placeholder={formData.discount_type === 'percentage' ? 'No limit' : 'Get 1 free'}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="usage_limit">Total Usage Limit</Label>
                  <Input
                    id="usage_limit"
                    type="number"
                    value={formData.usage_limit || ''}
                    onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value ? parseInt(e.target.value) : null })}
                    min={1}
                    placeholder="Unlimited"
                  />
                </div>

                <div>
                  <Label htmlFor="per_user_limit">Per User Limit</Label>
                  <Input
                    id="per_user_limit"
                    type="number"
                    value={formData.per_user_limit || ''}
                    onChange={(e) => setFormData({ ...formData, per_user_limit: e.target.value ? parseInt(e.target.value) : null })}
                    min={1}
                    placeholder="Unlimited"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="valid_from">Valid From</Label>
                  <Input
                    id="valid_from"
                    type="date"
                    value={formData.valid_from}
                    onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="valid_until">Valid Until</Label>
                  <Input
                    id="valid_until"
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="is_active">Active</Label>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Saving...' : editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                </Button>
                {editingCoupon && (
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </div>

          {/* Coupons List Section */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold text-lg mb-4">Existing Coupons</h3>
            
            {loading && coupons.length === 0 ? (
              <p className="text-sm text-gray-500">Loading coupons...</p>
            ) : coupons.length === 0 ? (
              <p className="text-sm text-gray-500">No coupons created yet. Create your first coupon!</p>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {coupons.map((coupon) => (
                  <div 
                    key={coupon.id} 
                    className={`border rounded-lg p-3 ${!coupon.is_active ? 'bg-gray-50 opacity-60' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {getDiscountIcon(coupon.discount_type)}
                          <span className="font-mono font-bold text-sm">{coupon.code}</span>
                          {!coupon.is_active && (
                            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">Inactive</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{coupon.description}</p>
                        <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded">
                            {getDiscountDisplay(coupon)}
                          </span>
                          {coupon.min_order_value > 0 && (
                            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
                              Min: ₹{coupon.min_order_value}
                            </span>
                          )}
                          {coupon.usage_limit && (
                            <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded">
                              {coupon.usage_count}/{coupon.usage_limit} used
                            </span>
                          )}
                        </div>
                        {coupon.valid_until && (
                          <p className="text-xs text-gray-400 mt-1">
                            Expires: {new Date(coupon.valid_until).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1 ml-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(coupon)}
                          className="h-8 w-8 p-0"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(coupon.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
