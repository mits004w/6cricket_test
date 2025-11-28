import { Component, ChangeDetectionStrategy, OnInit, OnDestroy } from '@angular/core';
import { DeadlineService } from './services/deadline.service';
import { BehaviorSubject, interval, Subject, switchMap, takeUntil, tap, startWith } from 'rxjs';

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

  private startCountdownWorkflow() {
    this.deadlineService.getDeadline()
      .pipe(
        tap(res => this.secondsLeft$.next(res.secondsLeft)),
        switchMap(res =>
          interval(1000).pipe(
            startWith(0),
            tap(tick => {
              const current = res.secondsLeft - tick;
              if (current >= 0) {
                this.secondsLeft$.next(current);
              }
               else {
                // new - deadline passed, get the new deadline
                this.startCountdownWorkflow();
              }
            })
          )
        ),
        takeUntil(this.destroy$)//ensure no memory leak when component is destroyed
      )
      .subscribe();
  }  

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
