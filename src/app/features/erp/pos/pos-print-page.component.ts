import { DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import QRCode from 'qrcode';
import {
  DEFAULT_POS_COMPANY_PRINT,
  POS_PRINT_STORAGE_KEY,
  posPrintQrPayloadText,
  type PosPrintPayload,
} from './pos-print.models';

@Component({
  standalone: true,
  selector: 'app-pos-print-page',
  imports: [DecimalPipe, RouterLink],
  templateUrl: './pos-print-page.component.html',
  styleUrl: './pos-print-page.component.css',
})
export class PosPrintPageComponent implements OnInit {
  private readonly router = inject(Router);

  readonly payload = signal<PosPrintPayload | null>(null);
  /** PNG data URL for the QR, or null while generating / on failure. */
  readonly qrDataUrl = signal<string | null>(null);

  ngOnInit(): void {
    const raw = sessionStorage.getItem(POS_PRINT_STORAGE_KEY);
    if (!raw) {
      this.payload.set(null);
      return;
    }
    try {
      const parsed = JSON.parse(raw) as PosPrintPayload;
      if (!parsed?.lines || !Array.isArray(parsed.lines)) {
        this.payload.set(null);
        return;
      }
      const merged = this.withGstFallbacks(parsed);
      this.payload.set(merged);
      void this.prepareQrAndAutoPrint(merged);
    } catch {
      this.payload.set(null);
    }
  }

  /** Supports older session payloads that omit GST fields. */
  private withGstFallbacks(p: PosPrintPayload): PosPrintPayload {
    const net = Number.isFinite(p.netTotal) ? p.netTotal : 0;
    const gstRatePercent =
      typeof p.gstRatePercent === 'number' && Number.isFinite(p.gstRatePercent)
        ? p.gstRatePercent
        : 0;
    const gstAmount =
      typeof p.gstAmount === 'number' && Number.isFinite(p.gstAmount)
        ? p.gstAmount
        : Math.round(net * (gstRatePercent / 100) * 100) / 100;
    const totalIncGst =
      typeof p.totalIncGst === 'number' && Number.isFinite(p.totalIncGst)
        ? p.totalIncGst
        : Math.round((net + gstAmount) * 100) / 100;

    return {
      ...p,
      company: p.company ?? DEFAULT_POS_COMPANY_PRINT,
      gstRatePercent,
      gstAmount,
      totalIncGst,
    };
  }

  private async prepareQrAndAutoPrint(p: PosPrintPayload): Promise<void> {
    await this.generateQr(p);
    /** Let the QR image bind before the print preview opens. */
    requestAnimationFrame(() => {
      requestAnimationFrame(() => this.printThenReturnToPos());
    });
  }

  private async generateQr(p: PosPrintPayload): Promise<void> {
    const text = posPrintQrPayloadText(p);
    try {
      const url = await QRCode.toDataURL(text, {
        width: 160,
        margin: 2,
        errorCorrectionLevel: 'M',
      });
      this.qrDataUrl.set(url);
    } catch {
      this.qrDataUrl.set(null);
    }
  }

  /** Opens the print dialog, then navigates to POS when the dialog closes. */
  printThenReturnToPos(): void {
    window.addEventListener(
      'afterprint',
      () => {
        void this.router.navigate(['/app/pos']);
      },
      { once: true },
    );
    window.print();
  }

  triggerPrint(): void {
    this.printThenReturnToPos();
  }

  printedAtLabel(iso: string): string {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
  }
}
