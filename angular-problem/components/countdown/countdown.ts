// <improvement> Used local storage to avoid API call on browser refresh and if user opens multiple tabs in the browser then deadline will be fetched from local storage instead of API
// <improvement> Removed styleURrl from component metadata as I haven't applied any css to this component
// <improvement> Added condition (line 82) to handle the next workflow once deadline is passed
// <improvement> Created the custom pipe to transform the data that can be used across multiple places. Used HH:mm:ss format for better user experience
// <improvement> Created different methods and wrapped ngOnInit code into startCountdownWorkflow method

import { Component, ChangeDetectionStrategy, OnInit, OnDestroy } from '@angular/core';
import { DeadlineService } from './services/deadline.service';
import { BehaviorSubject, interval, Subject, switchMap, takeUntil, tap, startWith } from 'rxjs';

const STORAGE_KEY = 'deadline_expiry';

@Component({
  selector: 'app-countdown',
  templateUrl: './countdown.component.html',
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
      //continue to next action or refetch new deadline
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
