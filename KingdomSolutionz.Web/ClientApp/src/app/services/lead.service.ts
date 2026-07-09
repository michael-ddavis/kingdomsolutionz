import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface CreateLeadRequest {
  fullName: string;
  email: string;
  phone?: string | null;
  businessName?: string | null;
  currentWebsiteUrl?: string | null;
  projectType: string;
  timeline?: string | null;
  budgetRange?: string | null;
  features: string[];
  message?: string | null;
  recommendedPackage: string;
}

export interface CreateLeadResponse {
  leadId: string;
  message: string;
  recommendedPackage: string;
  receivedAtUtc: string;
}

@Injectable({
  providedIn: 'root'
})
export class LeadService {
  private readonly apiUrl = '/api/leads';

  constructor(private httpClient: HttpClient) {}

  createLead(request: CreateLeadRequest): Observable<CreateLeadResponse> {
    return this.httpClient.post<CreateLeadResponse>(this.apiUrl, request);
  }
}