import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
  Event,
  CreateEventRequest,
  TicketType,
  CreateTicketTypeRequest,
  Ticket,
  PurchaseTicketRequest,
  Transaction,
  OrganizerBalance,
  Withdrawal,
  WithdrawalRequest,
  PlatformStats,
  PlatformSettings,
  EventStats,
  Category,
  APIError,
  PurchaseTicketResponse,
  ReviewRequest,
  ModeratorStats
} from './types';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

class APIClient {
  private getHeaders(includeAuth = false): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      const token = this.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  }

  setToken(token: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  clearToken() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error: APIError = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`
      }));
      throw new Error(error.error || 'An error occurred');
    }
    return response.json();
  }

  // Authentication Endpoints
  async register(data: RegisterRequest): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    const result = await this.handleResponse<{ message: string }>(response);
    // Don't set token - user needs to verify email first
    return result;
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    const result = await this.handleResponse<AuthResponse>(response);
    this.setToken(result.token);
    return result;
  }

  async resendVerification(email: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/resend-verification`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ email }),
    });
    return this.handleResponse<{ message: string }>(response);
  }

  async getProfile(): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/profile`, {
      headers: this.getHeaders(true),
    });
    return this.handleResponse<User>(response);
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/profile`, {
      method: 'PUT',
      headers: this.getHeaders(true),
      body: JSON.stringify(data),
    });
    return this.handleResponse<User>(response);
  }

  // Public Event Endpoints
  async getEvents(params?: { category?: string; city?: string; search?: string }): Promise<Event[]> {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.append('category', params.category);
    if (params?.city) queryParams.append('city', params.city);
    if (params?.search) queryParams.append('search', params.search);

    const response = await fetch(`${API_BASE_URL}/events?${queryParams.toString()}`);
    return this.handleResponse<Event[]>(response);
  }

  async getEvent(id: string): Promise<Event> {
    const response = await fetch(`${API_BASE_URL}/events/${id}`);
    return this.handleResponse<Event>(response);
  }

  // Organizer Endpoints
  async createEvent(data: CreateEventRequest): Promise<Event> {
    const response = await fetch(`${API_BASE_URL}/organizer/events`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify(data),
    });
    return this.handleResponse<Event>(response);
  }

  async updateEvent(id: string, data: Partial<CreateEventRequest>): Promise<Event> {
    const response = await fetch(`${API_BASE_URL}/organizer/events/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(true),
      body: JSON.stringify(data),
    });
    return this.handleResponse<Event>(response);
  }

  async uploadEventImage(eventId: string, file: File): Promise<{ image_url: string }> {
    const formData = new FormData();
    formData.append('image', file);

    const token = this.getToken();
    const response = await fetch(`${API_BASE_URL}/organizer/events/${eventId}/image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    return this.handleResponse<{ image_url: string }>(response);
  }

  async getMyEvents(status?: string): Promise<Event[]> {
    const queryParams = status ? `?status=${status}` : '';
    const response = await fetch(`${API_BASE_URL}/organizer/events${queryParams}`, {
      headers: this.getHeaders(true),
    });
    return this.handleResponse<Event[]>(response);
  }

  async getOrganizerEvent(id: string): Promise<Event> {
    const response = await fetch(`${API_BASE_URL}/organizer/events/${id}`, {
      headers: this.getHeaders(true),
    });
    return this.handleResponse<Event>(response);
  }

  async submitEventForReview(id: string): Promise<{ message: string; event: Event }> {
    const response = await fetch(`${API_BASE_URL}/organizer/events/${id}/submit`, {
      method: 'POST',
      headers: this.getHeaders(true),
    });
    return this.handleResponse<{ message: string; event: Event }>(response);
  }

  async publishEvent(id: string): Promise<{ message: string; event: Event }> {
    const response = await fetch(`${API_BASE_URL}/organizer/events/${id}/publish`, {
      method: 'POST',
      headers: this.getHeaders(true),
    });
    return this.handleResponse<{ message: string; event: Event }>(response);
  }

  async createTicketType(eventId: string, data: CreateTicketTypeRequest): Promise<TicketType> {
    const response = await fetch(`${API_BASE_URL}/organizer/events/${eventId}/ticket-types`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify(data),
    });
    return this.handleResponse<TicketType>(response);
  }

  async getOrganizerBalance(): Promise<OrganizerBalance> {
    const response = await fetch(`${API_BASE_URL}/organizer/balance`, {
      headers: this.getHeaders(true),
    });
    return this.handleResponse<OrganizerBalance>(response);
  }

  async requestWithdrawal(data: WithdrawalRequest): Promise<Withdrawal> {
    const response = await fetch(`${API_BASE_URL}/organizer/withdrawals`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify(data),
    });
    return this.handleResponse<Withdrawal>(response);
  }

  async getMyWithdrawals(): Promise<Withdrawal[]> {
    const response = await fetch(`${API_BASE_URL}/organizer/withdrawals`, {
      headers: this.getHeaders(true),
    });
    return this.handleResponse<Withdrawal[]>(response);
  }

  async getEventStats(eventId: string): Promise<EventStats> {
    const response = await fetch(`${API_BASE_URL}/organizer/events/${eventId}/stats`, {
      headers: this.getHeaders(true),
    });
    return this.handleResponse<EventStats>(response);
  }

  // Ticket Purchase Endpoints
  async purchaseTickets(data: PurchaseTicketRequest): Promise<PurchaseTicketResponse> {
    const response = await fetch(`${API_BASE_URL}/tickets/purchase`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify(data),
    });
    return this.handleResponse<PurchaseTicketResponse>(response);
  }

  async verifyPayment(reference: string): Promise<{ message: string; status: string; tickets: Ticket[] }> {
    const response = await fetch(`${API_BASE_URL}/payments/verify?reference=${reference}`, {
      headers: this.getHeaders(false), // Public endpoint, no auth required
    });
    return this.handleResponse<{ message: string; status: string; tickets: Ticket[] }>(response);
  }

  async getMyTickets(): Promise<Ticket[]> {
    const response = await fetch(`${API_BASE_URL}/tickets/my-tickets`, {
      headers: this.getHeaders(true),
    });
    return this.handleResponse<Ticket[]>(response);
  }

  async getTicket(id: string): Promise<Ticket> {
    const response = await fetch(`${API_BASE_URL}/tickets/${id}`, {
      headers: this.getHeaders(true),
    });
    return this.handleResponse<Ticket>(response);
  }

  async getTransactions(): Promise<Transaction[]> {
    const response = await fetch(`${API_BASE_URL}/transactions`, {
      headers: this.getHeaders(true),
    });
    return this.handleResponse<Transaction[]>(response);
  }

  // Moderator Endpoints
  async getPendingEvents(): Promise<Event[]> {
    const response = await fetch(`${API_BASE_URL}/moderator/events/pending`, {
      headers: this.getHeaders(true),
    });
    return this.handleResponse<Event[]>(response);
  }

  async getMyReviews(): Promise<Event[]> {
    const response = await fetch(`${API_BASE_URL}/moderator/reviews`, {
      headers: this.getHeaders(true),
    });
    return this.handleResponse<Event[]>(response);
  }

  async getEventForReview(id: string): Promise<Event> {
    const response = await fetch(`${API_BASE_URL}/moderator/events/${id}`, {
      headers: this.getHeaders(true),
    });
    return this.handleResponse<Event>(response);
  }

  async reviewEvent(id: string, data: ReviewRequest): Promise<{ message: string; event: Event }> {
    const response = await fetch(`${API_BASE_URL}/moderator/events/${id}/review`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify(data),
    });
    return this.handleResponse<{ message: string; event: Event }>(response);
  }

  async getModeratorStats(): Promise<ModeratorStats> {
    const response = await fetch(`${API_BASE_URL}/moderator/stats`, {
      headers: this.getHeaders(true),
    });
    return this.handleResponse<ModeratorStats>(response);
  }

  // Admin Endpoints
  async getPlatformSettings(): Promise<PlatformSettings> {
    const response = await fetch(`${API_BASE_URL}/settings`, {
      headers: this.getHeaders(false), // Now a public endpoint
    });
    return this.handleResponse<PlatformSettings>(response);
  }

  async updatePlatformSettings(data: Partial<PlatformSettings>): Promise<PlatformSettings> {
    const response = await fetch(`${API_BASE_URL}/admin/settings`, {
      method: 'PUT',
      headers: this.getHeaders(true),
      body: JSON.stringify(data),
    });
    return this.handleResponse<PlatformSettings>(response);
  }

  async getWithdrawalRequests(status?: string): Promise<Withdrawal[]> {
    const queryParams = status ? `?status=${status}` : '';
    const response = await fetch(`${API_BASE_URL}/admin/withdrawals${queryParams}`, {
      headers: this.getHeaders(true),
    });
    return this.handleResponse<Withdrawal[]>(response);
  }

  async reviewWithdrawal(id: string, data: ReviewRequest): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/admin/withdrawals/${id}/review`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify(data),
    });
    return this.handleResponse<{ message: string }>(response);
  }

  async processWithdrawal(id: string, transactionRef: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/admin/withdrawals/${id}/process`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify({ transaction_ref: transactionRef }),
    });
    return this.handleResponse<{ message: string }>(response);
  }

  async getPlatformStats(): Promise<PlatformStats> {
    const response = await fetch(`${API_BASE_URL}/admin/stats`, {
      headers: this.getHeaders(true),
    });
    return this.handleResponse<PlatformStats>(response);
  }

  async getAllUsers(params?: { role?: string; page?: number; limit?: number }): Promise<User[]> {
    const queryParams = new URLSearchParams();
    if (params?.role) queryParams.append('role', params.role);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const response = await fetch(`${API_BASE_URL}/admin/users?${queryParams.toString()}`, {
      headers: this.getHeaders(true),
    });
    return this.handleResponse<User[]>(response);
  }

  async updateUserRole(userId: string, role: string): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/role`, {
      method: 'PUT',
      headers: this.getHeaders(true),
      body: JSON.stringify({ role }),
    });
    return this.handleResponse<User>(response);
  }

  async toggleUserStatus(userId: string): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/toggle-status`, {
      method: 'PUT',
      headers: this.getHeaders(true),
    });
    return this.handleResponse<User>(response);
  }

  // Ticket Download
  async downloadTicketPDF(ticketId: string): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}/download`, {
      headers: this.getHeaders(true),
    });

    if (!response.ok) {
      throw new Error('Failed to download ticket');
    }

    return response.blob();
  }

  // Category Management (Admin only)
  async getCategories(): Promise<Category[]> {
    const response = await fetch(`${API_BASE_URL}/categories`, {
      headers: this.getHeaders(false),
    });
    return this.handleResponse<Category[]>(response);
  }

  async createCategory(data: {
    name: string;
    description?: string;
    color?: string;
    icon?: string;
  }): Promise<Category> {
    const response = await fetch(`${API_BASE_URL}/admin/categories`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify(data),
    });
    return this.handleResponse<Category>(response);
  }

  async updateCategory(id: string, data: {
    name?: string;
    description?: string;
    color?: string;
    icon?: string;
    is_active?: boolean;
  }): Promise<Category> {
    const response = await fetch(`${API_BASE_URL}/admin/categories/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(true),
      body: JSON.stringify(data),
    });
    return this.handleResponse<Category>(response);
  }

  async deleteCategory(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/admin/categories/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(true),
    });
    return this.handleResponse<void>(response);
  }

  // Featured Events (Admin only)
  async toggleEventFeatured(eventId: string): Promise<Event> {
    const response = await fetch(`${API_BASE_URL}/admin/events/${eventId}/featured`, {
      method: 'PATCH',
      headers: this.getHeaders(true),
    });
    return this.handleResponse<Event>(response);
  }

  async getFeaturedEvents(): Promise<Event[]> {
    const response = await fetch(`${API_BASE_URL}/events/featured`, {
      headers: this.getHeaders(false),
    });
    return this.handleResponse<Event[]>(response);
  }

  // Two-Factor Authentication
  async setup2FA(): Promise<{
    secret: string;
    qr_code: string;
    manual_entry_key: string;
  }> {
    const response = await fetch(`${API_BASE_URL}/2fa/setup`, {
      method: 'POST',
      headers: this.getHeaders(true),
    });
    return this.handleResponse(response);
  }

  async enable2FA(data: { code: string }): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/2fa/enable`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  async disable2FA(data: { code: string }): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/2fa/disable`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  async verify2FA(data: { email: string; code: string }): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/verify-2fa`, {
      method: 'POST',
      headers: this.getHeaders(false),
      body: JSON.stringify(data),
    });
    return this.handleResponse<AuthResponse>(response);
  }
}

export const apiClient = new APIClient();
