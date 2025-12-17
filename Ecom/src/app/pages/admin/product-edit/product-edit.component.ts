import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductService } from '../../../services/product.service';
import { finalize } from 'rxjs/operators';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-product-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, HttpClientModule],
  templateUrl: './product-edit.component.html',
  styleUrls: ['./product-edit.component.css']
})
export class ProductEditComponent implements OnInit {

  form: any;

  id = '';
  loading = true;
  saving = false;
  message = '';
  categories: any[] = [];

  // image management
  existingImages: string[] = [];
  removedImages: string[] = [];
  newFiles: File[] = [];
  newPreviews: string[] = [];
  uploadedNewUrls: string[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private productSvc: ProductService
  ) {
    // FIX 1: initialize form INSIDE constructor
    this.form = this.fb.group({
      title: ['', [Validators.required]],
      price: [0, [Validators.required]],
      description: [''],
      category: ['']
    });
  }

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id') || '';
    if (!this.id) {
      this.message = 'Missing product id';
      this.loading = false;
      return;
    }

    // load categories and product in parallel
    this.productSvc.getCategories().subscribe({
      next: (res: any) => {
        this.categories = res?.categories || res || [];
      },
      error: () => { /* ignore - categories optional */ }
    });

    this.loadProduct();
  }

  loadProduct() {
    this.loading = true;
    this.productSvc.getProductAdmin(this.id).subscribe({
      next: (res: any) => {
        const p = res.product;
        this.form.patchValue({
          title: p.title || '',
          price: p.price ?? 0,
          description: p.description || '',
          category: p.category?._id || p.category || ''
        });

        this.existingImages = Array.isArray(p.images) ? [...p.images] : [];
        this.removedImages = [];
        this.newFiles = [];
        this.newPreviews = [];
        this.uploadedNewUrls = [];

        this.loading = false;
      },
      error: (err: any) => {
        this.loading = false;
        this.message = err?.error?.message || 'Failed to load product';
      }
    });
  }

  toggleRemoveExisting(url: string) {
    if (this.removedImages.includes(url)) {
      this.removedImages = this.removedImages.filter(u => u !== url);
      if (!this.existingImages.includes(url)) this.existingImages.push(url);
    } else {
      this.removedImages.push(url);
      this.existingImages = this.existingImages.filter(u => u !== url);
    }
  }

  onFilesSelected(ev: Event) {
    const input = ev.target as HTMLInputElement;
    if (!input.files) return;

    const files = Array.from(input.files);
    for (const f of files) {
      if (!f.type.startsWith('image/')) continue;
      this.newFiles.push(f);
      this.newPreviews.push(URL.createObjectURL(f));
    }
    input.value = '';
  }

  removeNewFile(index: number) {
    const f = this.newFiles[index];
    if (f) {
      URL.revokeObjectURL(this.newPreviews[index]);
      this.newFiles.splice(index, 1);
      this.newPreviews.splice(index, 1);
    }
  }

  uploadNewFiles(): Promise<string[]> {
    if (this.newFiles.length === 0) return Promise.resolve([]);

    return this.productSvc.uploadImages(this.newFiles).toPromise().then(res => {
      // FIX 2: res?.urls instead of res.urls
      const urls = res?.urls || [];
      this.uploadedNewUrls.push(...urls);

      this.newPreviews.forEach(u => URL.revokeObjectURL(u));
      this.newFiles = [];
      this.newPreviews = [];

      return urls;
    });
  }

  buildFinalImages(): string[] {
    return [...this.existingImages, ...this.uploadedNewUrls];
  }

  async save() {
    if (this.form.invalid) {
      this.message = 'Please fix form errors';
      return;
    }

    this.saving = true;
    this.message = '';

    try {
      if (this.newFiles.length > 0) {
        await this.uploadNewFiles();
      }

      const payload: any = {
        title: this.form.value.title,
        price: this.form.value.price,
        description: this.form.value.description,
        category: this.form.value.category || null,
        existingImages: JSON.stringify(this.buildFinalImages())
      };

      await this.productSvc.updateProduct(this.id, payload).toPromise();

      this.saving = false;
      this.message = 'Product updated successfully';

      setTimeout(() => this.router.navigate(['/admin/products']), 900);

    } catch (err: any) {
      this.saving = false;
      this.message = err?.error?.message || 'Update failed';
    }
  }

  imgAlt(url: string) {
    return url?.split('/').pop() || 'image';
  }
}
