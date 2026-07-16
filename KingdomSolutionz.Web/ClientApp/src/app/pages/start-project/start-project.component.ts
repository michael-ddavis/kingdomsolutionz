import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LeadService } from 'src/app/services/lead.service';

interface FeatureOption {
  value: string;
  title: string;
  description: string;
}

interface FeatureGroup {
  title: string;
  description: string;
  options: FeatureOption[];
}

interface PackageRecommendation {
  name: string;
  buildFee: string;
  monthlyFee: string;
  description: string;
}

@Component({
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  selector: 'app-start-project',
  templateUrl: './start-project.component.html',
  styleUrls: ['./start-project.component.scss']
})
export class StartProjectComponent {
  submitted = false;
  submitting = false;
  submitError = '';
  leadResponseMessage = '';

  featureGroups: FeatureGroup[] = [
    {
      title: 'Website Foundation',
      description: 'Start with the core website structure and experience.',
      options: [
        {
          value: 'New Website',
          title: 'New Website',
          description: 'A clean, professional website built from the ground up.'
        },
        {
          value: 'Website Redesign',
          title: 'Website Redesign',
          description: 'Improve the look, structure, messaging, and flow of an existing site.'
        },
        {
          value: 'Landing Page',
          title: 'Landing Page',
          description: 'A focused page for one offer, event, product, service, or campaign.'
        },
        {
          value: 'Mobile Optimization',
          title: 'Mobile Optimization',
          description: 'Make sure the site looks clean and works well on phones and tablets.'
        }
      ]
    },
    {
      title: 'Selling & Growth Tools',
      description: 'Add tools that help people buy, book, subscribe, or take action.',
      options: [
        {
          value: 'Ecommerce Integration',
          title: 'Ecommerce Integration',
          description: 'Connect Stan Store, Kajabi, Shopify, Stripe, Square, or another selling tool.'
        },
        {
          value: 'Booking Scheduling',
          title: 'Booking / Scheduling',
          description: 'Add booking links, consultation requests, or appointment scheduling.'
        },
        {
          value: 'Email Capture',
          title: 'Email Capture',
          description: 'Add newsletter signup, lead magnet, or email list forms.'
        },
        {
          value: 'Analytics Setup',
          title: 'Analytics Setup',
          description: 'Track visits, traffic sources, clicks, and form submissions.'
        }
      ]
    },
    {
      title: 'Content & Trust',
      description: 'Show people who you are, what you do, and why they can trust you.',
      options: [
        {
          value: 'Portfolio Gallery',
          title: 'Portfolio / Gallery',
          description: 'Showcase projects, photos, work samples, events, or testimonials.'
        },
        {
          value: 'Testimonials Results Page',
          title: 'Testimonials / Results Page',
          description: 'Highlight reviews, client results, impact stories, or before-and-after wins.'
        },
        {
          value: 'Blog Resources',
          title: 'Blog / Resources',
          description: 'Add articles, updates, devotionals, announcements, or educational content.'
        }
      ]
    },
    {
      title: 'Advanced',
      description: 'For custom tools, internal systems, dashboards, and more complex workflows.',
      options: [
        {
          value: 'Custom Dashboard CRM',
          title: 'Custom Dashboard / CRM',
          description: 'Build an admin tool, internal tracker, client portal, intake manager, or workflow system.'
        }
      ]
    }
  ];

  projectForm = this.formBuilder.group({
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    businessName: [''],
    currentWebsiteUrl: [''],
    projectType: ['', Validators.required],
    timeline: [''],
    budgetRange: [''],
    features: this.formBuilder.array<string>([]),
    message: ['']
  });

  constructor(private formBuilder: FormBuilder, private leadService: LeadService) { }

  get selectedFeatures(): FormArray {
    return this.projectForm.get('features') as FormArray;
  }

  get selectedFeatureValues(): string[] {
    return this.selectedFeatures.value;
  }

  isFeatureSelected(value: string): boolean {
    return this.selectedFeatureValues.includes(value);
  }

  toggleFeature(value: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;

    if (checked && !this.isFeatureSelected(value)) {
      this.selectedFeatures.push(this.formBuilder.control(value, { nonNullable: true }));
      return;
    }

    const index = this.selectedFeatures.controls.findIndex(control => control.value === value);

    if (index >= 0) {
      this.selectedFeatures.removeAt(index);
    }
  }

  get recommendedPackage(): PackageRecommendation {
    const features = this.selectedFeatureValues;
    const selectedFeatureCount = features.length;
    const projectType = this.projectForm.value.projectType;

    const hasEcommerce = features.includes('Ecommerce Integration');
    const hasCustomDashboard = features.includes('Custom Dashboard CRM');
    const hasBlog = features.includes('Blog Resources');
    const hasLandingPage = features.includes('Landing Page');
    const budgetRange = this.projectForm.value.budgetRange;

    if (
      hasCustomDashboard ||
      selectedFeatureCount >= 8 ||
      budgetRange === '$4,000+' ||
      projectType === 'Custom system / dashboard'
    ) {
      return {
        name: 'Premium Website + Ongoing Support Package',
        buildFee: '$4,000',
        monthlyFee: '$350/month maintenance',
        description:
          'Best fit for a more hands-on website with more pages, advanced features, custom systems, and ongoing support.'
      };
    }

    if (
      hasEcommerce ||
      hasBlog ||
      hasLandingPage ||
      selectedFeatureCount >= 4 ||
      projectType === 'Ecommerce integration'
    ) {
      return {
        name: 'Professional Website + Ecommerce Package',
        buildFee: '$2,800',
        monthlyFee: '$250/month maintenance',
        description:
          'Best fit for a polished website with ecommerce, course, email, analytics, or growth-focused features.'
      };
    }

    return {
      name: 'Starter Website Package',
      buildFee: '$1,800',
      monthlyFee: '$150/month maintenance',
      description:
        'Best fit for getting online with a clean, professional website and a simple foundation.'
    };
  }

  get recommendationReason(): string {
    const features = this.selectedFeatureValues;

    if (features.includes('Custom Dashboard CRM')) {
      return 'You selected a custom dashboard or CRM, which usually requires a more advanced build.';
    }

    if (features.includes('Ecommerce Integration')) {
      return 'You selected ecommerce integration, so the Professional package is likely a better fit.';
    }

    if (features.length >= 8) {
      return 'You selected several features, so a larger build with more support is likely needed.';
    }

    if (features.length >= 4) {
      return 'You selected multiple growth or content features, so the Professional package is likely a better fit.';
    }

    return 'Your current selections look like a strong fit for a clean starter website.';
  }

  onSubmit(): void {
    this.projectForm.markAllAsTouched();
    this.submitError = '';
    this.leadResponseMessage = '';

    if (this.projectForm.invalid) {
      this.submitError = 'Please fill out the required fields before submitting.';
      return;
    }

    const formValue = this.projectForm.value;

    const request = {
      fullName: formValue.fullName ?? '',
      email: formValue.email ?? '',
      phone: formValue.phone ?? '',
      businessName: formValue.businessName ?? '',
      currentWebsiteUrl: formValue.currentWebsiteUrl ?? '',
      projectType: formValue.projectType ?? '',
      timeline: formValue.timeline ?? '',
      budgetRange: formValue.budgetRange ?? '',
      features: this.selectedFeatureValues,
      message: formValue.message ?? '',
      recommendedPackage: this.recommendedPackage.name
    };

    this.submitting = true;

    this.leadService.createLead(request).subscribe({
      next: (response) => {
        this.submitting = false;
        this.submitted = true;
        this.leadResponseMessage = response.message;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      error: (error) => {
        console.error('Lead submission failed:', error);
        this.submitting = false;
        this.submitError = 'Something went wrong while submitting your request. Please try again.';
      }
    });
  }
}
