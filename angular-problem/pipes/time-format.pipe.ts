import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'hhmmss',
  pure: true
})
export class HhmmssPipe implements PipeTransform {
  transform(totalSeconds: number | null): string {
    if (totalSeconds === null) return '--:--:--';

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (n: number) => String(n).padStart(2, '0');

    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
}