import { Component, ChangeDetectionStrategy, OnInit, OnDestroy } from '@angular/core';
import { DeadlineService } from './services/deadline.service';
import { BehaviorSubject, interval, Subject, switchMap, takeUntil, tap, startWith } from 'rxjs';

const STORAGE_KEY = 'deadline_expiry';

@Component({
  selector: 'app-countdown',
  templateUrl: './countdown.component.html',
  styleUrls: ['./countdown.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush //change detection only updates when we have update from Behavioural Subject
})
export class CountdownComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private secondsLeft$ = new BehaviorSubject<number | null>(null);

  secondsLeftObs$ = this.secondsLeft$.asObservable();

  constructor(private deadlineService: DeadlineService) {}
  
  //new - fetch deadline data from API on page load
  ngOnInit(): void {
     this.startCountdownWorkflow();
  }
  
  /** Initialize countdown using local storage or API */
  private initializeCountdown(): void {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (stored) {
      const expiry = Number(stored);
      if (!isNaN(expiry) && expiry > Date.now()) {
        this.expiryTs = expiry;
        this.startTicker();
        return;
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    }

    // If no valid storage, fetch deadline from server
    this.fetchDeadlineFromServer();
  }

  private fetchDeadlineFromServer() {
    this.deadlineService.getDeadline()
      .pipe(
        takeUntil(this.destroy$)//ensure no memory leak when component is destroyed
      )
       .subscribe(res => {
        if (!res) return;

        const expiry = Date.now() + res.secondsLeft * 1000;
        localStorage.setItem(STORAGE_KEY, String(expiry));
        this.expiryTs = expiry;

        this.startTicker();
      });
  }
  private startTicker(): void {
    this.updateSecondsLeft();

    interval(1000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateSecondsLeft();
      });
  }
  private updateSecondsLeft(): void {
    if (!this.expiryTs) return;

    const remainingMs = this.expiryTs - Date.now();
    const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));

    this.secondsLeft$.next(remainingSec);

    if (remainingSec <= 0) {
      localStorage.removeItem(STORAGE_KEY);
      this.fetchDeadlineFromServer(); // refetch new deadline
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
