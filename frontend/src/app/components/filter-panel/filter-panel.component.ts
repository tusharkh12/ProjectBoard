import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import type { TaskListComponent } from '../../pages/task-list/task-list.component';

export interface FilterPanelData {
  taskList: TaskListComponent;
}

/**
 * Jira-style floating panel that hosts all view / sort / filter controls.
 */
@Component({
  selector: 'app-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatDividerModule,
    MatIconModule,
    MatButtonModule,
    MatCheckboxModule,
    MatSelectModule,
    MatFormFieldModule
  ],
  templateUrl: './filter-panel.component.html',
  styleUrls: ['./filter-panel.component.scss']
})
export class FilterPanelComponent {
  private readonly dialogRef = inject(MatDialogRef<FilterPanelComponent>);
  readonly data = inject(MAT_DIALOG_DATA) as FilterPanelData;
  readonly parent = this.data.taskList;

  readonly viewModes = [
    { value: 'cards' as const, icon: 'view_agenda', label: 'Cards' },
    { value: 'list' as const, icon: 'view_list', label: 'List' },
    { value: 'compact' as const, icon: 'view_headline', label: 'Compact' }
  ];

  close(): void {
    this.dialogRef.close();
  }

  hasActiveFilters(): boolean {
    return this.parent.selectedStatuses().length > 0 || 
           this.parent.selectedPriorities().length > 0 ||
           this.parent.selectedAssignees().length > 0;
  }

  onSortChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.parent.setSortBy(target.value);
  }

  getPriorityIcon(priority: string): string {
    switch (priority) {
      case 'critical': return 'keyboard_double_arrow_up';
      case 'high': return 'keyboard_arrow_up';
      case 'medium': return 'remove';
      case 'low': return 'keyboard_arrow_down';
      default: return 'remove';
    }
  }
}
