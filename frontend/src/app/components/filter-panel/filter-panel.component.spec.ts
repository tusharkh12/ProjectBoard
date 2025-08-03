import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { FilterPanelComponent, FilterPanelData } from './filter-panel.component';

describe('FilterPanelComponent', () => {
  let component: FilterPanelComponent;
  let fixture: ComponentFixture<FilterPanelComponent>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<FilterPanelComponent>>;
  let mockTaskList: any;

  beforeEach(async () => {
    // Create mock task list with required methods
    mockTaskList = {
      selectedStatuses: jasmine.createSpy('selectedStatuses').and.returnValue([]),
      selectedPriorities: jasmine.createSpy('selectedPriorities').and.returnValue([]),
      selectedAssignees: jasmine.createSpy('selectedAssignees').and.returnValue([]),
      availableStatuses: jasmine.createSpy('availableStatuses').and.returnValue([
        { value: 'backlog', label: 'Backlog' },
        { value: 'in_progress', label: 'In Progress' }
      ]),
      availablePriorities: jasmine.createSpy('availablePriorities').and.returnValue([
        { value: 'high', label: 'High' },
        { value: 'medium', label: 'Medium' }
      ]),
      getSelectedStatusCount: jasmine.createSpy('getSelectedStatusCount').and.returnValue(0),
      getSelectedPriorityCount: jasmine.createSpy('getSelectedPriorityCount').and.returnValue(0),
      isStatusSelected: jasmine.createSpy('isStatusSelected').and.returnValue(false),
      isPrioritySelected: jasmine.createSpy('isPrioritySelected').and.returnValue(false),
      toggleStatusSelection: jasmine.createSpy('toggleStatusSelection'),
      togglePrioritySelection: jasmine.createSpy('togglePrioritySelection'),
      clearAllFilters: jasmine.createSpy('clearAllFilters'),
      sortBy: jasmine.createSpy('sortBy').and.returnValue('title'),
      sortDirection: jasmine.createSpy('sortDirection').and.returnValue('asc'),
      viewMode: jasmine.createSpy('viewMode').and.returnValue('cards'),
      sortOptions: jasmine.createSpy('sortOptions').and.returnValue([
        { value: 'title', label: 'Title' },
        { value: 'priority', label: 'Priority' }
      ]),
      toggleSortDirection: jasmine.createSpy('toggleSortDirection'),
      setSortBy: jasmine.createSpy('setSortBy'),
      setViewMode: jasmine.createSpy('setViewMode')
    };

    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

    const mockData: FilterPanelData = {
      taskList: mockTaskList
    };

    await TestBed.configureTestingModule({
      imports: [FilterPanelComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockData }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FilterPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should be a standalone component', () => {
    expect(FilterPanelComponent.prototype).toBeDefined();
  });

  it('should initialize with dialog data', () => {
    expect(component.data).toBeDefined();
    expect(component.parent).toBe(mockTaskList);
  });

  it('should have view modes defined', () => {
    expect(component.viewModes).toBeDefined();
    expect(component.viewModes.length).toBe(3);
    expect(component.viewModes[0].value).toBe('cards');
  });

  it('should close dialog when close() is called', () => {
    component.close();
    expect(mockDialogRef.close).toHaveBeenCalled();
  });

  it('should check if has active filters', () => {
    // Mock no active filters
    mockTaskList.selectedStatuses.and.returnValue([]);
    mockTaskList.selectedPriorities.and.returnValue([]);
    
    expect(component.hasActiveFilters()).toBeFalse();

    // Mock active status filter
    mockTaskList.selectedStatuses.and.returnValue(['backlog']);
    expect(component.hasActiveFilters()).toBeTrue();

    // Mock active priority filter
    mockTaskList.selectedStatuses.and.returnValue([]);
    mockTaskList.selectedPriorities.and.returnValue(['high']);
    expect(component.hasActiveFilters()).toBeTrue();
  });

  it('should handle sort change', () => {
    const mockEvent = {
      target: { value: 'priority' }
    } as unknown as Event;

    component.onSortChange(mockEvent);
    expect(mockTaskList.setSortBy).toHaveBeenCalledWith('priority');
  });

  it('should get priority icons correctly', () => {
    expect(component.getPriorityIcon('critical')).toBe('keyboard_double_arrow_up');
    expect(component.getPriorityIcon('high')).toBe('keyboard_arrow_up');
    expect(component.getPriorityIcon('medium')).toBe('remove');
    expect(component.getPriorityIcon('low')).toBe('keyboard_arrow_down');
    expect(component.getPriorityIcon('unknown')).toBe('remove');
  });
});