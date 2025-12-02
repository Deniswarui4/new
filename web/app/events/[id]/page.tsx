'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { Event, TicketType, CartItem } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Calendar, MapPin, Ticket, Trash2, Share2, Heart, Star, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { useCurrency } from '@/lib/currency';
import Image from 'next/image';

export default function EventDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { formatAmount } = useCurrency();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    if (params.id) {
      loadEvent(params.id as string);
    }
  }, [params.id]);

  const loadEvent = async (id: string) => {
    try {
      setLoading(true);
      const data = await apiClient.getEvent(id);
      setEvent(data);
    } catch (error) {
      toast.error('Failed to load event');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };



  const removeFromCart = (ticket_type_id: string) => {
    setCart(cart.filter(item => item.ticket_type_id !== ticket_type_id));
    toast.success('Removed from cart');
  };

  const clearCart = () => {
    setCart([]);
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.ticket_type.price * item.quantity), 0);
  };

  const getCartItemsCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const handleCheckout = async () => {
    if (!event || cart.length === 0) return;

    try {
      setPurchasing(true);
      const validItems = cart.filter(item => item.ticket_type_id && item.quantity > 0);

      if (validItems.length === 0) {
        toast.error('Cart contains invalid items');
        return;
      }

      const response = await apiClient.purchaseTickets({
        event_id: event.id,
        items: validItems.map(item => ({
          ticket_type_id: item.ticket_type_id,
          quantity: item.quantity,
        })),
      });

      clearCart();
      window.location.href = response.authorization_url;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Purchase failed');
      console.error(error);
    } finally {
      setPurchasing(false);
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

  const isTicketAvailable = (ticketType: TicketType) => {
    const now = new Date();
    const saleStart = new Date(ticketType.sale_start);
    const saleEnd = new Date(ticketType.sale_end);
    const available = ticketType.quantity - ticketType.sold;

    // Check if ticket is available: within sale period and has available quantity
    return now >= saleStart && now <= saleEnd && available > 0;
  };

  const getAvailableTickets = (ticketType: TicketType) => {
    return ticketType.quantity - ticketType.sold;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-20">
          <Skeleton className="h-[400px] w-full mb-8 rounded-3xl" />
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-40 w-full" />
            </div>
            <Skeleton className="h-96 w-full" />
          </div>
        </main>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-20">
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold mb-2">Event Not Found</h2>
            <p className="text-muted-foreground mb-6">The event you are looking for does not exist or has been removed.</p>
            <Button onClick={() => router.push('/events')}>Browse Events</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 pt-24 pb-12">
        {/* Title Section (Above Hero) */}
        <div className="container mx-auto px-4 mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            {event.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center">
              <Star className="h-4 w-4 text-primary fill-primary mr-1" />
              <span className="font-medium text-foreground mr-1">4.9</span>
              <span className="underline decoration-muted-foreground/50">(128 reviews)</span>
            </div>
            <span className="hidden sm:inline">•</span>
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-1" />
              <span className="underline decoration-muted-foreground/50">{event.venue}, {event.city}, {event.country}</span>
            </div>
            <span className="hidden sm:inline">•</span>
            <Badge variant="secondary" className="font-normal">
              {event.category}
            </Badge>
          </div>
        </div>

        {/* Hero Image Grid (Airbnb Style) */}
        <div className="container mx-auto px-4 mb-8">
          <div className="relative aspect-[21/9] md:aspect-[3/1] w-full overflow-hidden rounded-xl bg-muted">
            {event.image_url ? (
              <img
                src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8080'}${event.image_url}`}
                alt={event.title}
                className="object-cover w-full h-full hover:scale-105 transition-transform duration-700"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-secondary">
                <Calendar className="h-16 w-16 text-muted-foreground/30" />
              </div>
            )}

            {/* Share/Save Buttons Overlay */}
            <div className="absolute top-4 right-4 flex gap-2">
              <Button variant="secondary" size="sm" className="bg-white/90 hover:bg-white text-foreground shadow-sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="secondary" size="sm" className="bg-white/90 hover:bg-white text-foreground shadow-sm">
                <Heart className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Host Info */}
              <div className="flex items-center justify-between pb-6 border-b">
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold">Hosted by {event.organizer?.first_name} {event.organizer?.last_name}</h2>
                  <p className="text-muted-foreground">
                    {formatDate(event.start_date)} • {formatTime(event.start_date)}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                  {event.organizer?.first_name[0]}
                </div>
              </div>

              {/* Highlights */}
              <div className="space-y-4 pb-6 border-b">
                <div className="flex gap-4">
                  <Calendar className="h-6 w-6 text-foreground mt-1" />
                  <div>
                    <h3 className="font-medium">Date and time</h3>
                    <p className="text-muted-foreground text-sm">
                      {formatDate(event.start_date)} at {formatTime(event.start_date)} - <br />
                      {formatDate(event.end_date)} at {formatTime(event.end_date)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <MapPin className="h-6 w-6 text-foreground mt-1" />
                  <div>
                    <h3 className="font-medium">Location</h3>
                    <p className="text-muted-foreground text-sm">{event.venue}</p>
                    <p className="text-muted-foreground text-sm">{event.address}, {event.city}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Ticket className="h-6 w-6 text-foreground mt-1" />
                  <div>
                    <h3 className="font-medium">Cancellation policy</h3>
                    <p className="text-muted-foreground text-sm">Refunds available up to 24 hours before event start.</p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="pb-6 border-b">
                <h2 className="text-xl font-semibold mb-4">About this event</h2>
                <div className="prose prose-neutral max-w-none text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {event.description}
                </div>
              </div>

              {/* Map Placeholder */}
              <div>
                <h2 className="text-xl font-semibold mb-4">Where you'll be</h2>
                <div className="h-80 bg-muted rounded-xl flex items-center justify-center border">
                  <div className="text-center">
                    <MapPin className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">Map view is currently unavailable</p>
                    <p className="text-sm text-muted-foreground mt-1">{event.city}, {event.country}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar - Sticky Booking Widget */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <Card className="shadow-xl border-border/50 overflow-hidden">
                  <CardHeader className="pb-4 border-b bg-muted/20">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold">
                        {event.ticket_types && event.ticket_types.length > 0
                          ? formatAmount(Math.min(...event.ticket_types.map(t => t.price)))
                          : 'Free'}
                      </span>
                      <span className="text-muted-foreground">/ person</span>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    {/* Ticket Selection */}
                    <div className="space-y-4">
                      {!event.ticket_types || event.ticket_types.length === 0 ? (
                        <div className="text-center py-4 text-muted-foreground">
                          <p>No tickets available.</p>
                        </div>
                      ) : (
                        event.ticket_types.map((ticketType) => {
                          const available = getAvailableTickets(ticketType);
                          const isAvailable = isTicketAvailable(ticketType);
                          const inCart = cart.find(item => item.ticket_type_id === ticketType.id);

                          return (
                            <div key={ticketType.id} className={`rounded-lg border p-3 transition-all ${isAvailable ? 'hover:border-primary/50' : 'opacity-50 bg-muted'}`}>
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <div className="font-medium">{ticketType.name}</div>
                                  <div className="text-xs text-muted-foreground">{available} left</div>
                                </div>
                                <div className="font-semibold">{formatAmount(ticketType.price)}</div>
                              </div>

                              {isAvailable ? (
                                <div className="flex items-center justify-end gap-3 mt-2">
                                  {inCart ? (
                                    <div className="flex items-center gap-3">
                                      <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8 rounded-full"
                                        onClick={() => {
                                          if (inCart.quantity > 1) {
                                            const newCart = [...cart];
                                            const idx = newCart.findIndex(i => i.ticket_type_id === ticketType.id);
                                            newCart[idx].quantity -= 1;
                                            setCart(newCart);
                                          } else {
                                            removeFromCart(ticketType.id);
                                          }
                                        }}
                                      >
                                        -
                                      </Button>
                                      <span className="w-4 text-center text-sm font-medium">{inCart.quantity}</span>
                                      <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8 rounded-full"
                                        onClick={() => {
                                          if (inCart.quantity < (ticketType.max_per_order || 10)) {
                                            const newCart = [...cart];
                                            const idx = newCart.findIndex(i => i.ticket_type_id === ticketType.id);
                                            newCart[idx].quantity += 1;
                                            setCart(newCart);
                                          }
                                        }}
                                      >
                                        +
                                      </Button>
                                    </div>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="w-full"
                                      onClick={() => {
                                        if (!user) {
                                          toast.error('Please login to purchase tickets');
                                          router.push('/login');
                                          return;
                                        }
                                        setCart([...cart, {
                                          ticket_type_id: ticketType.id,
                                          quantity: 1,
                                          ticket_type: ticketType
                                        }]);
                                      }}
                                    >
                                      Add
                                    </Button>
                                  )}
                                </div>
                              ) : (
                                <div className="text-xs text-destructive font-medium text-right mt-2">Sold Out</div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>

                    <Button
                      className="w-full h-12 text-lg font-semibold"
                      size="lg"
                      disabled={cart.length === 0 || purchasing}
                      onClick={handleCheckout}
                    >
                      {purchasing ? 'Processing...' : `Reserve • ${formatAmount(getCartTotal())}`}
                    </Button>

                    <div className="text-center text-xs text-muted-foreground">
                      You won't be charged yet
                    </div>
                  </CardContent>
                </Card>

                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4" />
                  <span>Secure Payment by Paystack</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}


