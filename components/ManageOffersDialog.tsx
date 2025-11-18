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
import { Percent, DollarSign, Plus, Pencil, Trash2, Tag, Search } from "lucide-react";

interface Offer {
  id: string;
  code: string;
  name: string;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  is_active: boolean;
  created_at: string;
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
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState<FormData>({
    code: '',
    name: '',
    discount_type: 'percent',
    discount_value: 0,
    is_active: true,
  });

  // Fetch offers when dialog opens
  useEffect(() => {
    if (open) {
      fetchOffers();
    }
  }, [open]);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/offers', {
        credentials: 'include',
      });
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

    // Validation
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
      toast.error('Percentage discount cannot exceed 100%');
      return;
    }

    try {
      setLoading(true);

      const url = editingOffer ? '/api/offers' : '/api/offers';
      const method = editingOffer ? 'PUT' : 'POST';
      const body = editingOffer ? { id: editingOffer.id, ...formData } : formData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(editingOffer ? 'Offer updated successfully' : 'Offer created successfully');
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

  const handleDeleteClick = (id: string) => {
    setOfferToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!offerToDelete) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/offers?id=${offerToDelete}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Offer deleted successfully');
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

  const filteredOffers = offers.filter(offer =>
    offer.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    offer.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Tag className="w-4 h-4 mr-2" />
            Manage Offers
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Offers</DialogTitle>
            <DialogDescription>
              Create and manage discount offers for your franchise
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Create/Edit Form */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                {editingOffer ? 'Edit Offer' : 'Create New Offer'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="code">Offer Code *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="SUMMER2025"
                    disabled={!!editingOffer} // Can't change code when editing
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    3-20 characters, unique per franchise
                  </p>
                </div>

                <div>
                  <Label htmlFor="name">Offer Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Summer Sale 2025"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Human-readable name for admin reference
                  </p>
                </div>

                <div>
                  <Label htmlFor="discount_type">Discount Type *</Label>
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
                      <SelectItem value="percent">
                        <div className="flex items-center">
                          <Percent className="w-4 h-4 mr-2" />
                          Percentage
                        </div>
                      </SelectItem>
                      <SelectItem value="fixed">
                        <div className="flex items-center">
                          <DollarSign className="w-4 h-4 mr-2" />
                          Fixed Amount
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="discount_value">
                    Discount Value * ({formData.discount_type === 'percent' ? '%' : '₹'})
                  </Label>
                  <Input
                    id="discount_value"
                    type="number"
                    step="0.01"
                    min="0"
                    max={formData.discount_type === 'percent' ? 100 : undefined}
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) || 0 })}
                    placeholder={formData.discount_type === 'percent' ? '10' : '100'}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Saving...' : editingOffer ? 'Update Offer' : 'Create Offer'}
                  </Button>
                  {editingOffer && (
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </div>

            {/* Offers List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Active Offers</h3>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search offers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-48"
                  />
                </div>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="text-center py-4">Loading offers...</div>
                ) : filteredOffers.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    {searchQuery ? 'No offers found matching your search' : 'No active offers yet'}
                  </div>
                ) : (
                  filteredOffers.map((offer) => (
                    <div
                      key={offer.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <code className="font-mono text-sm bg-muted px-2 py-1 rounded">
                            {offer.code}
                          </code>
                          <span className="text-sm text-muted-foreground">
                            {offer.discount_type === 'percent'
                              ? `${offer.discount_value}% off`
                              : `₹${offer.discount_value} off`
                            }
                          </span>
                        </div>
                        <p className="text-sm font-medium mt-1">{offer.name}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(offer)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(offer.id)}
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Offer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this offer? This action cannot be undone.
              If the offer has been used by customers, it cannot be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
