'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { Ticket } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Calendar, MapPin, Download, QrCode } from 'lucide-react';
import { toast } from 'sonner';
import { useCurrency } from '@/lib/currency';

export default function MyTicketsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { formatAmount } = useCurrency();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination state
  const [currentPageUpcoming, setCurrentPageUpcoming] = useState(1);
  const [currentPagePast, setCurrentPagePast] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else {
        loadTickets();
      }
    }
  }, [user, authLoading, router]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getMyTickets();
      setTickets(data);
    } catch (error) {
      toast.error('Failed to load tickets');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTicket = async (ticketId: string) => {
    try {
      const blob = await apiClient.downloadTicketPDF(ticketId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ticket-${ticketId}.pdf`;
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
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'default';
      case 'used':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const upcomingTickets = tickets.filter(
    t => t.status === 'confirmed' && t.event && new Date(t.event.start_date) > new Date()
  );

  const pastTickets = tickets.filter(
    t => t.event && new Date(t.event.start_date) <= new Date()
  );

  // Pagination helpers
  const getPaginatedItems = (items: Ticket[], currentPage: number) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return items.slice(startIndex, startIndex + itemsPerPage);
  };

  const getTotalPages = (items: Ticket[]) => Math.ceil(items.length / itemsPerPage);

  const renderPagination = (items: Ticket[], currentPage: number, setCurrentPage: (page: number) => void) => {
    const totalPages = getTotalPages(items);
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
      const pages: (number | string)[] = [];
      if (totalPages <= 5) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
      } else {
        if (currentPage <= 3) {
          for (let i = 1; i <= 4; i++) pages.push(i);
          pages.push('ellipsis');
          pages.push(totalPages);
        } else if (currentPage >= totalPages - 2) {
          pages.push(1);
          pages.push('ellipsis');
          for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
        } else {
          pages.push(1);
          pages.push('ellipsis');
          for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
          pages.push('ellipsis');
          pages.push(totalPages);
        }
      }
      return pages;
    };

    return (
      <div className="mt-6">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => {
                  if (currentPage > 1) {
                    setCurrentPage(currentPage - 1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
            {getPageNumbers().map((page, index) => (
              <PaginationItem key={index}>
                {page === 'ellipsis' ? (
                  <PaginationEllipsis />
                ) : (
                  <PaginationLink
                    onClick={() => {
                      setCurrentPage(page as number);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    isActive={currentPage === page}
                    className="cursor-pointer"
                  >
                    {page}
                  </PaginationLink>
                )}
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={() => {
                  if (currentPage < totalPages) {
                    setCurrentPage(currentPage + 1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
        <p className="text-center text-sm text-muted-foreground mt-4">
          Showing {Math.min((currentPage - 1) * itemsPerPage + 1, items.length)} to {Math.min(currentPage * itemsPerPage, items.length)} of {items.length} tickets
        </p>
      </div>
    );
  };

  const renderTicketCard = (ticket: Ticket) => (
    <Card key={ticket.id}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-xl">{ticket.event?.title}</CardTitle>
            <CardDescription className="mt-2">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="h-4 w-4" />
                {ticket.event && formatDate(ticket.event.start_date)}
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {ticket.event?.venue}, {ticket.event?.city}
              </div>
            </CardDescription>
          </div>
          <Badge variant={getStatusColor(ticket.status)} className="capitalize">
            {ticket.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Ticket Type</p>
              <p className="font-medium">{ticket.ticket_type?.name}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Price</p>
              <p className="font-medium">{formatAmount(ticket.price)}</p>
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Ticket Number</p>
            <p className="font-mono text-sm">{ticket.ticket_number}</p>
          </div>

          {ticket.status === 'confirmed' && (
            <div className="flex gap-2">
              {ticket.qr_code_url && (
                <Button variant="outline" className="flex-1" asChild>
                  <a
                    href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8080'}${ticket.qr_code_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <QrCode className="h-4 w-4 mr-2" />
                    QR Code
                  </a>
                </Button>
              )}
              <Link href={`/tickets/${ticket.id}`} className="flex-1">
                <Button variant="default" className="w-full">
                  View Details
                </Button>
              </Link>
            </div>
          )}
          {ticket.status !== 'confirmed' && (
            <Link href={`/tickets/${ticket.id}`} className="w-full block">
              <Button variant="outline" className="w-full">
                View Details
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">My Tickets</h1>
          <div className="flex items-center space-x-2">
            <Link href="/events">
              <Button>Browse Events</Button>
            </Link>
          </div>
        </div>

        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="upcoming">
              Upcoming ({upcomingTickets.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              Past Events ({pastTickets.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4">
            {upcomingTickets.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground mb-4">You don&apos;t have any upcoming tickets</p>
                  <Button onClick={() => router.push('/events')}>
                    Browse Events
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {getPaginatedItems(upcomingTickets, currentPageUpcoming).map(renderTicketCard)}
                {renderPagination(upcomingTickets, currentPageUpcoming, setCurrentPageUpcoming)}
              </>
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-4">
            {pastTickets.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No past tickets</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {getPaginatedItems(pastTickets, currentPagePast).map(renderTicketCard)}
                {renderPagination(pastTickets, currentPagePast, setCurrentPagePast)}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
