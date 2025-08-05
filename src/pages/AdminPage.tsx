import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Copy } from 'lucide-react';

interface PromoCode {
  id: string;
  code: string;
  type: string;
  description: string;
  usage_limit: number;
  used_count: number;
  expires_at: string | null;
  active: boolean;
  created_at: string;
}

const AdminPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [newCode, setNewCode] = useState({
    code: '',
    type: 'demo' as 'demo' | 'monthly_free' | 'lifetime',
    description: '',
    usage_limit: 1,
    expires_at: '',
  });

  const loadPromoCodes = async () => {
    try {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('created_by', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPromoCodes(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load promo codes.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (user) {
      loadPromoCodes();
    }
  }, [user]);

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleCreateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.code.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('promo_codes')
        .insert({
          code: newCode.code.toUpperCase(),
          type: newCode.type,
          description: newCode.description,
          usage_limit: newCode.usage_limit,
          expires_at: newCode.expires_at || null,
          created_by: user?.id,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Promo code created successfully!",
      });

      // Reset form
      setNewCode({
        code: '',
        type: 'demo',
        description: '',
        usage_limit: 1,
        expires_at: '',
      });

      // Reload codes
      loadPromoCodes();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create promo code.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id: string, active: boolean) => {
    try {
      const { error } = await supabase
        .from('promo_codes')
        .update({ active: !active })
        .eq('id', id)
        .eq('created_by', user?.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Promo code ${!active ? 'activated' : 'deactivated'}.`,
      });

      loadPromoCodes();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update promo code.",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Promo code copied to clipboard!",
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'demo': return 'secondary';
      case 'monthly_free': return 'default';
      case 'lifetime': return 'destructive';
      default: return 'secondary';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'demo': return 'Demo (1 day)';
      case 'monthly_free': return 'Monthly Free';
      case 'lifetime': return 'Lifetime';
      default: return type;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8">Promo Code Management</h1>
      
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Create New Promo Code */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Create New Promo Code</CardTitle>
              <CardDescription>Generate promo codes for different access types</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateCode} className="space-y-4">
                <div>
                  <Label htmlFor="code">Promo Code</Label>
                  <div className="flex gap-2">
                    <Input
                      id="code"
                      value={newCode.code}
                      onChange={(e) => setNewCode({ ...newCode, code: e.target.value.toUpperCase() })}
                      placeholder="Enter code"
                      disabled={loading}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setNewCode({ ...newCode, code: generateRandomCode() })}
                      disabled={loading}
                    >
                      Generate
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="type">Access Type</Label>
                  <Select
                    value={newCode.type}
                    onValueChange={(value: any) => setNewCode({ ...newCode, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="demo">Demo (1 day trial)</SelectItem>
                      <SelectItem value="monthly_free">Monthly Free (30 days)</SelectItem>
                      <SelectItem value="lifetime">Lifetime Access</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={newCode.description}
                    onChange={(e) => setNewCode({ ...newCode, description: e.target.value })}
                    placeholder="Internal description"
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label htmlFor="usage_limit">Usage Limit</Label>
                  <Input
                    id="usage_limit"
                    type="number"
                    min="1"
                    value={newCode.usage_limit}
                    onChange={(e) => setNewCode({ ...newCode, usage_limit: parseInt(e.target.value) || 1 })}
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label htmlFor="expires_at">Expiration Date (Optional)</Label>
                  <Input
                    id="expires_at"
                    type="datetime-local"
                    value={newCode.expires_at}
                    onChange={(e) => setNewCode({ ...newCode, expires_at: e.target.value })}
                    disabled={loading}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading || !newCode.code.trim()}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {loading ? 'Creating...' : 'Create Promo Code'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Existing Promo Codes */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Existing Promo Codes</CardTitle>
              <CardDescription>Manage your created promo codes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {promoCodes.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No promo codes created yet.
                  </p>
                ) : (
                  promoCodes.map((code) => (
                    <div key={code.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                            {code.code}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(code.code)}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                          <Badge variant={getTypeColor(code.type) as any}>
                            {getTypeLabel(code.type)}
                          </Badge>
                          <Badge variant={code.active ? "default" : "secondary"}>
                            {code.active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleActive(code.id, code.active)}
                        >
                          {code.active ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        <p>Usage: {code.used_count}/{code.usage_limit}</p>
                        {code.description && <p>Description: {code.description}</p>}
                        {code.expires_at && (
                          <p>Expires: {new Date(code.expires_at).toLocaleDateString()}</p>
                        )}
                        <p>Created: {new Date(code.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
