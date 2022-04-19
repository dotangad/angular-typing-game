import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, ViewChild } from '@angular/core';
import {
  finalize,
  map,
  Observable,
  scan,
  startWith,
  takeWhile,
  timer,
} from 'rxjs';
import { Quote } from 'src/quote';
import * as _ from 'lodash';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  readonly title = 'Angular Typing Game';
  readonly timeLimit = 120;

  @ViewChild('input', { static: true }) inputEl?: ElementRef<HTMLInputElement>;
  sampleText = '';
  gameStarted = false;
  gameOver = false;
  timer$?: Observable<number>;
  wpm$?: Observable<number>;
  inputState = '';
  typed = '';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.fetchSampleText().subscribe(
      (quotes) =>
        (this.sampleText = _.shuffle(quotes)
          .slice(0, 10)
          .map(({ text }) => text)
          .join(' '))
    );
    this.inputEl?.nativeElement.focus();
  }

  fetchSampleText() {
    return this.http.get<Quote[]>('https://type.fit/api/quotes');
  }

  formatTime(time: number) {
    return `${String(Math.floor(time / 60)).padStart(2, '0')}:${String(
      time % 60
    ).padStart(2, '0')}`;
  }

  startGame() {
    this.gameStarted = true;
    this.timer$ = timer(0, 1000).pipe(
      scan((acc) => --acc, this.timeLimit),
      takeWhile((x) => x >= 0 && !this.gameOver),
      finalize(() => (this.gameOver = true))
    );

    this.wpm$ = this.timer$.pipe(
      startWith(0),
      takeWhile((x) => x >= 0 && !this.gameOver),
      map((time) => {
        const words = this.typed.split(' ').filter((x) => !!x).length;
        const elapsed = this.timeLimit - time;
        const minutes = elapsed / 60;

        return Math.floor(words / minutes);
      })
    );

    this.inputEl?.nativeElement.focus();
  }

  untypedText() {
    return this.sampleText.replace(this.typed, '');
  }

  onTyping() {
    const untyped = this.untypedText();
    const untypedWords = untyped.split(' ').filter((x) => !!x).length;

    if (untypedWords === 1 && this.inputState === untyped) {
      this.typed += this.inputState;
      this.inputState = '';
      this.gameOver = true;
    }

    if (
      this.inputState.includes(' ') &&
      untyped.slice(0, this.inputState.length) === this.inputState
    ) {
      this.typed += this.inputState;
      this.inputState = '';
    }
  }
}
