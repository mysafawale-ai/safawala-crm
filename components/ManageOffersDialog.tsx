"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Tag, X } from "lucide-react";

interface Offer {
  id: string;
  code: string;
  name: string;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  is_active: boolean;
}

interface FormData {
  code: string;
  name: string;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  is_active: boolean;
}

export default function ManageOffersDialog() {
  const [open, setOpen] = useState(false);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [offerToDelete, setOfferToDelete] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<FormData>({
    code: '',
    name: '',
    discount_type: 'percent',
    discount_value: 0,
    is_active: true,
  });

  useEffect(() => {
    if (open) {
      fetchOffers();
    }
  }, [open]);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/offers', { credentials: 'include' });
      const data = await response.json();
      if (response.ok) {
        setOffers(data.offers || []);
      } else {
        toast.error(data.error || 'Failed to fetch offers');
      }
    } catch (error) {
      console.error('Error fetching offers:', error);
      toast.error('Failed to load offers');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      discount_type: 'percent',
      discount_value: 0,
      is_active: true,
    });
    setEditingOffer(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code.trim()) {
      toast.error('Offer code is required');
      return;
    }
    if (!formData.name.trim()) {
      toast.error('Offer name is required');
      return;
    }
    if (formData.discount_value <= 0) {
      toast.error('Discount value must be greater than 0');
      return;
    }
    if (formData.discount_type === 'percent' && formData.discount_value > 100) {
      toast.error('Percentage cannot exceed 100%');
      return;
    }

    try {
      setLoading(true);
      const method = editingOffer ? 'PUT' : 'POST';
      const body = editingOffer ? { id: editingOffer.id, ...formData } : formData;

      const response = await fetch('/api/offers', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include',
      });

      const data = await response.json();
      if (response.ok) {
        toast.success(editingOffer ? 'Offer updated' : 'Offer created');
        resetForm();
        fetchOffers();
      } else {
        toast.error(data.error || 'Failed to save offer');
      }
    } catch (error) {
      console.error('Error saving offer:', error);
      toast.error('Failed to save offer');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (offer: Offer) => {
    setEditingOffer(offer);
    setFormData({
      code: offer.code,
      name: offer.name,
      discount_type: offer.discount_type,
      discount_value: offer.discount_value,
      is_active: offer.is_active,
    });
  };

  const handleDelete = async (id: string) => {
    setOfferToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!offerToDelete) return;
    try {
      setLoading(true);
      const response = await fetch(`/api/offers?id=${offerToDelete}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await response.json();
      if (response.ok) {
        toast.success('Offer deleted');
        fetchOffers();
      } else {
        toast.error(data.error || 'Failed to delete offer');
      }
    } catch (error) {
      console.error('Error deleting offer:', error);
      toast.error('Failed to delete offer');
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
      setOfferToDelete(null);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Tag className="w-4 h-4 mr-2" />
            Manage Offers
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Offers</DialogTitle>
            <DialogDescription>
              Create, edit, and manage discount offers
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Form Section */}
            <div className="border-b pb-6">
              <h3 className="text-sm font-semibold mb-4">
                {editingOffer ? 'Edit Offer' : 'New Offer'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="code">Code *</Label>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      placeholder="e.g., SAVE10"
                      disabled={!!editingOffer}
                    />
                  </div>
                  <div>
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Summer Sale"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type">Type *</Label>
                    <Select
                      value={formData.discount_type}
                      onValueChange={(value: 'percent' | 'fixed') =>
                        setFormData({ ...formData, discount_type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percent">Percentage (%)</SelectItem>
                        <SelectItem value="fixed">Fixed (₹)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="value">Value * ({formData.discount_type === 'percent' ? '%' : '₹'})</Label>
                    <Input
                      id="value"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.discount_value}
                      onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) || 0 })}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="active" className="cursor-pointer">Active</Label>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={loading} size="sm">
                    {loading ? 'Saving...' : editingOffer ? 'Update' : 'Create'}
                  </Button>
                  {editingOffer && (
                    <Button type="button" variant="outline" size="sm" onClick={resetForm}>
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </div>

            {/* Offers List */}
            <div>
              <h3 className="text-sm font-semibold mb-3">All Offers ({offers.length})</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {loading ? (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                ) : offers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No offers yet</p>
                ) : (
                  offers.map((offer) => (
                    <div
                      key={offer.id}
                      className="flex items-center justify-between p-3 border rounded bg-muted/30 hover:bg-muted/50 transition"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-background px-2 py-1 rounded font-mono">
                            {offer.code}
                          </code>
                          <span className="text-sm">
                            {offer.discount_type === 'percent'
                              ? `${offer.discount_value}%`
                              : `₹${offer.discount_value}`
                            }
                          </span>
                          {!offer.is_active && (
                            <span className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">
                              Inactive
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{offer.name}</p>
                      </div>
                      <div className="flex gap-1 ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(offer)}
                          className="h-8 w-8 p-0"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(offer.id)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Offer?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone. If customers have used this offer, consider deactivating instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
