import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { APP_VERSION } from '@/lib/version';

const schema = z.object({
  type: z.enum(['bug', 'feature', 'general'], { required_error: 'Please select a feedback type' }),
  message: z.string().min(5, 'Please provide at least 5 characters'),
  email: z.string().email('Please enter a valid email').optional().or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;

const FeedbackPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const params = new URLSearchParams(location.search);
  const fromParam = params.get('from');
  const currentRoute = fromParam ? decodeURIComponent(fromParam) : (location.pathname + location.search + location.hash);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'general', message: '', email: '' },
  });

  // Simple SEO tags
  useEffect(() => {
    document.title = 'Send Feedback | MarkTapDance';
    const meta = document.querySelector('meta[name="description"]') || document.createElement('meta');
    meta.setAttribute('name', 'description');
    meta.setAttribute('content', 'Send feedback: bug reports, feature requests, and general feedback.');
    document.head.appendChild(meta);
  }, []);

  const deviceInfo = useMemo(() => ({
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    screen: { width: window.screen.width, height: window.screen.height, pixelRatio: window.devicePixelRatio },
  }), []);

  const onSubmit = async (values: FormValues) => {
    if (!user) return;

    const payload = {
      user_id: user.id,
      type: values.type,
      message: values.message,
      email: values.email || null,
      current_route: currentRoute,
      device_info: deviceInfo,
      app_version: APP_VERSION,
    };

    const { error } = await supabase.from('feedback').insert([payload]);
    if (error) {
      toast({ title: 'Error', description: 'Could not submit feedback. Please try again.' });
      return;
    }

    // Fire-and-forget email notification
    await supabase.functions.invoke('send-feedback', {
      body: {
        to: 'justinsmaxwell722@gmail.com',
        feedback: {
          ...payload,
          user_email: user.email,
        },
      },
    });

    toast({ title: 'Thank you!', description: 'Your feedback was submitted successfully.' });
    navigate('/app', { replace: true });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Send Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Feedback type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="bug">Bug report</SelectItem>
                          <SelectItem value="feature">Feature request</SelectItem>
                          <SelectItem value="general">General feedback</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Tell us what's on your mind..." rows={6} {...field} />
                      </FormControl>
                      <FormDescription>Include steps to reproduce for bugs if possible.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact email (optional)</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="you@example.com" {...field} />
                      </FormControl>
                      <FormDescription>Provide an email if you want us to follow up.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center gap-3">
                  <Button type="submit">Submit Feedback</Button>
                  <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FeedbackPage;
