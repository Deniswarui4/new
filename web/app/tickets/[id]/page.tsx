'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { Ticket } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Calendar, MapPin, Download, QrCode, ArrowLeft, Clock, User } from 'lucide-react';
import { toast } from 'sonner';
import { useCurrency } from '@/lib/currency';

export default function TicketDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { formatAmount } = useCurrency();
    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                router.push('/login');
            } else if (params.id) {
                loadTicket(params.id as string);
            }
        }
    }, [user, authLoading, params.id, router]);

    const loadTicket = async (id: string) => {
        try {
            setLoading(true);
            const data = await apiClient.getTicket(id);
            setTicket(data);
        } catch (error) {
            toast.error('Failed to load ticket details');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadTicket = async () => {
        if (!ticket) return;
        try {
            const blob = await apiClient.downloadTicketPDF(ticket.id);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ticket-${ticket.ticket_number}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast.success('Ticket downloaded successfully');
        } catch (error) {
            toast.error('Failed to download ticket');
            console.error(error);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed': return 'default';
            case 'used': return 'secondary';
            case 'cancelled': return 'destructive';
            default: return 'outline';
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex flex-col bg-background">
                <Navbar />
                <main className="flex-1 container mx-auto px-4 py-20">
                    <div className="max-w-3xl mx-auto">
                        <Skeleton className="h-8 w-32 mb-6" />
                        <Skeleton className="h-[500px] w-full rounded-xl" />
                    </div>
                </main>
            </div>
        );
    }

    if (!ticket) {
        return (
            <div className="min-h-screen flex flex-col bg-background">
                <Navbar />
                <main className="flex-1 container mx-auto px-4 py-20">
                    <div className="max-w-md mx-auto text-center">
                        <h2 className="text-2xl font-bold mb-2">Ticket Not Found</h2>
                        <p className="text-muted-foreground mb-6">The ticket you are looking for does not exist or you do not have permission to view it.</p>
                        <Button onClick={() => router.push('/my-tickets')}>Back to My Tickets</Button>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Navbar />

            <main className="flex-1 container mx-auto px-4 py-24">
                <div className="max-w-3xl mx-auto">
                    <div className="mb-6">
                        <Link href="/my-tickets" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to My Tickets
                        </Link>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Ticket Card */}
                        <div className="md:col-span-2 space-y-6">
                            <Card className="overflow-hidden border-primary/20 shadow-lg">
                                <div className="bg-primary/5 p-6 border-b border-border/50">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h1 className="text-2xl font-bold text-primary mb-2">{ticket.event?.title}</h1>
                                            <div className="flex items-center text-muted-foreground">
                                                <MapPin className="h-4 w-4 mr-2" />
                                                <span>{ticket.event?.venue}, {ticket.event?.city}</span>
                                            </div>
                                        </div>
                                        <Badge variant={getStatusColor(ticket.status)} className="capitalize text-sm px-3 py-1">
                                            {ticket.status}
                                        </Badge>
                                    </div>
                                </div>

                                <CardContent className="p-0">
                                    <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x border-b">
                                        <div className="p-6 space-y-4">
                                            <div>
                                                <p className="text-sm text-muted-foreground mb-1">Date & Time</p>
                                                <div className="flex items-center font-medium">
                                                    <Calendar className="h-4 w-4 mr-2 text-primary" />
                                                    {ticket.event && formatDate(ticket.event.start_date)}
                                                </div>
                                                <div className="flex items-center text-sm text-muted-foreground mt-1 ml-6">
                                                    <Clock className="h-3 w-3 mr-1" />
                                                    {ticket.event && formatTime(ticket.event.start_date)}
                                                </div>
                                            </div>

                                            <div>
                                                <p className="text-sm text-muted-foreground mb-1">Ticket Type</p>
                                                <p className="font-medium text-lg">{ticket.ticket_type?.name}</p>
                                                <p className="text-sm text-muted-foreground">{formatAmount(ticket.price)}</p>
                                            </div>
                                        </div>

                                        <div className="p-6 flex flex-col items-center justify-center text-center bg-muted/10">
                                            {ticket.status === 'confirmed' && ticket.qr_code_url ? (
                                                <>
                                                    <div className="bg-white p-2 rounded-lg shadow-sm mb-3">
                                                        <img
                                                            src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8080'}${ticket.qr_code_url}`}
                                                            alt="Ticket QR Code"
                                                            className="w-32 h-32 object-contain"
                                                        />
                                                    </div>
                                                    <p className="font-mono text-sm font-medium tracking-wider">{ticket.ticket_number}</p>
                                                    <p className="text-xs text-muted-foreground mt-1">Scan at entrance</p>
                                                </>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                                    <QrCode className="h-12 w-12 mb-2 opacity-20" />
                                                    <p className="text-sm">QR Code unavailable</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="p-6 bg-muted/5">
                                        <div className="flex flex-col sm:flex-row gap-3">
                                            <Button className="flex-1" onClick={handleDownloadTicket} disabled={ticket.status !== 'confirmed'}>
                                                <Download className="h-4 w-4 mr-2" />
                                                Download PDF Ticket
                                            </Button>
                                            <Button variant="outline" className="flex-1" onClick={() => router.push(`/events/${ticket.event_id}`)}>
                                                View Event Details
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Ticket Info */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Ticket Information</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex justify-between py-2 border-b">
                                        <span className="text-muted-foreground">Ticket Number</span>
                                        <span className="font-mono text-sm">{ticket.ticket_number}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b">
                                        <span className="text-muted-foreground">Price</span>
                                        <span className="font-medium">{formatAmount(ticket.price)}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b">
                                        <span className="text-muted-foreground">Purchase Date</span>
                                        <span>{formatDate(ticket.created_at)}</span>
                                    </div>
                                    {ticket.checked_in_at && (
                                        <div className="flex justify-between py-2">
                                            <span className="text-muted-foreground">Checked In</span>
                                            <span>{formatDate(ticket.checked_in_at)}</span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Sidebar Info */}
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Organizer</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                            {ticket.event?.organizer?.first_name?.[0]}
                                        </div>
                                        <div>
                                            <p className="font-medium">{ticket.event?.organizer?.first_name} {ticket.event?.organizer?.last_name}</p>
                                            <p className="text-xs text-muted-foreground">Host</p>
                                        </div>
                                    </div>
                                    <Button variant="outline" className="w-full" size="sm">
                                        Contact Organizer
                                    </Button>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Need Help?</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <p className="text-sm text-muted-foreground">
                                        Having trouble with your ticket? Check our help center or contact support.
                                    </p>
                                    <Button variant="link" className="p-0 h-auto text-primary">
                                        Visit Help Center
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
