import { Component, Input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Select } from 'primeng/select';
import { LedgerOption } from '../../data/ledgers';

@Component({
  selector: 'app-ledger-select',
  imports: [ReactiveFormsModule, Select],
  templateUrl: './ledger-select.component.html',
  styleUrl: './ledger-select.component.css',
})
export class LedgerSelectComponent {
  @Input({ required: true }) label!: string;
  @Input({ required: true }) control!: FormControl<string | null>;
  @Input() options: LedgerOption[] = [];
  @Input() inputId = 'ledger';
  @Input() placeholder = 'Select ledger';

  get selectOptions(): Array<{ id: string; label: string; code: string; name: string }> {
    return this.options.map((o) => ({
      id: o.id,
      code: o.code,
      name: o.name,
      label: `${o.code} — ${o.name}`,
    }));
  }
}
