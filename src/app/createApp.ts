import {
  createSession,
  FACTOR_MAX,
  FACTOR_MIN,
  getAvailablePoints,
  getCorrectAnswer,
  getCurrentTask,
  getStars,
  MAX_POINTS_PER_TASK,
  TABLE_MAX,
  TABLE_MIN,
  TASK_COUNT,
} from '../features/game/gameLogic';
import type { GameScreen, GameSession } from '../types/game';
import { createSoundEffects } from '../utils/sound';
import styles from './app.module.css';

interface AppState {
  screen: GameScreen;
  session: GameSession | null;
  lastTable: number | null;
}

export function createApp(root: HTMLElement): void {
  new MultiplicationApp(root).render();
}

class MultiplicationApp {
  private readonly root: HTMLElement;
  private state: AppState = {
    screen: 'start',
    session: null,
    lastTable: null,
  };
  private readonly sound = createSoundEffects();
  private rollInterval: number | null = null;
  private nextTimeout: number | null = null;

  constructor(root: HTMLElement) {
    this.root = root;
  }

  render(): void {
    if (this.state.screen === 'start') {
      this.renderStart();
      return;
    }

    if (this.state.screen === 'result') {
      this.renderResult();
      return;
    }

    this.renderGame();
  }

  private renderStart(): void {
    const buttons = Array.from(
      { length: TABLE_MAX - TABLE_MIN + 1 },
      (_, index) => index + TABLE_MIN,
    )
      .map(
        (table) => `
          <button class="${styles.tableButton}" type="button" data-table="${table}">
            <span>${table}</span>
            <small>er Reihe</small>
          </button>
        `,
      )
      .join('');

    this.root.innerHTML = `
      <main class="${styles.shell}">
        <section class="${styles.startPanel}" aria-labelledby="start-title">
          <div>
            <p class="${styles.eyebrow}">Einmaleins-Raumschiff</p>
            <h1 id="start-title" class="${styles.title}">Welches Raumschiff fliegt heute?</h1>
            <p class="${styles.intro}">
              Rette das Raumschiff vor den Meteoriten. Wähle eine Reihe aus.
              Knacke jeden Meteoriten an und sprenge ihn beim zweiten Treffer.
            </p>
          </div>
          <div class="${styles.startScene}" aria-hidden="true">
            <div class="${styles.startPlanet}"></div>
            <div class="${styles.startShip}">
              <span>?</span>
            </div>
            <i class="${styles.startMeteorOne}"></i>
            <i class="${styles.startMeteorTwo}"></i>
            <i class="${styles.startStarOne}"></i>
            <i class="${styles.startStarTwo}"></i>
            <i class="${styles.startStarThree}"></i>
          </div>
          <div class="${styles.tableGrid}" aria-label="Zahlenreihe auswählen">
            ${buttons}
          </div>
        </section>
        ${this.renderFooter()}
      </main>
    `;

    this.root.querySelectorAll<HTMLButtonElement>('[data-table]').forEach((button) => {
      button.addEventListener('click', () => {
        this.sound.unlock();
        const table = Number(button.dataset.table);
        this.startGame(table);
      });
    });
  }

  private renderGame(): void {
    const session = this.requireSession();
    const currentTask = getCurrentTask(session);
    const progress = session.currentIndex + 1;
    const completedTasks = session.currentIndex + (session.isLocked ? 1 : 0);
    const correctAnswer = getCorrectAnswer(session);
    const explodingAnswerIndex =
      session.feedbackTone === 'success' ? session.answers.indexOf(correctAnswer) : -1;
    const explosionOverlay =
      explodingAnswerIndex >= 0 && (session.meteorHits[correctAnswer] ?? 0) >= 2
        ? `
          <div class="${styles.explosionOverlay} ${styles[`explosionOrigin${explodingAnswerIndex + 1}`]}" aria-hidden="true">
            <b class="${styles.explosionRing}"></b>
            ${Array.from(
              { length: 10 },
              (_, shardIndex) =>
                `<i class="${styles.explosionShard} ${styles[`explosionShard${shardIndex + 1}`]}"></i>`,
            ).join('')}
          </div>
        `
        : '';
    const answerButtons = session.answers
      .map((answer, index) => {
        const isCorrectAnswer = session.isLocked && answer === correctAnswer;
        const isWrongAnswer = answer === session.lastWrongAnswer;
        const meteorHits = session.meteorHits[answer] ?? 0;
        const isCracked = meteorHits === 1;
        const isGone = meteorHits >= 2;
        const isExploding =
          isCorrectAnswer && session.feedbackTone === 'success' && isGone;
        const correctClass = isCorrectAnswer && !isExploding ? ` ${styles.correctMeteor}` : '';
        const hitClass =
          isCorrectAnswer && session.feedbackTone === 'success' && !isExploding
            ? ` ${styles.hitMeteor}`
            : '';
        const wrongClass = isWrongAnswer ? ` ${styles.wrongMeteor}` : '';
        const crackedClass = isCracked ? ` ${styles.crackedMeteor}` : '';
        const goneClass = isGone ? ` ${styles.goneMeteor}` : '';
        const explodingClass = isExploding ? ` ${styles.explodingMeteor}` : '';

        return `
          <button
            class="${styles.meteor} ${styles[`meteor${index + 1}`]}${correctClass}${hitClass}${wrongClass}${crackedClass}${goneClass}${explodingClass}"
            type="button"
            data-answer="${answer}"
            aria-label="Antwort ${answer}"
            ${session.isRolling || session.isLocked || isGone ? 'disabled' : ''}
          >
            <span>${answer}</span>
            ${
              isCracked
                ? `
                  <i class="${styles.crackLine} ${styles.crackLineOne}" aria-hidden="true"></i>
                  <i class="${styles.crackLine} ${styles.crackLineTwo}" aria-hidden="true"></i>
                  <i class="${styles.crackLine} ${styles.crackLineThree}" aria-hidden="true"></i>
                  <i class="${styles.crackPiece} ${styles.crackPieceOne}" aria-hidden="true"></i>
                  <i class="${styles.crackPiece} ${styles.crackPieceTwo}" aria-hidden="true"></i>
                  <i class="${styles.crackPiece} ${styles.crackPieceThree}" aria-hidden="true"></i>
                `
                : ''
            }
            ${
              isExploding ? '<i class="' + styles.explosionFlash + '" aria-hidden="true"></i>' : ''
            }
            ${isWrongAnswer ? `<small class="${styles.wrongLabel}">Falsch</small>` : ''}
          </button>
        `;
      })
      .join('');

    this.root.innerHTML = `
      <main class="${styles.shell}">
        <section class="${styles.gamePanel}" aria-labelledby="game-title">
          <header class="${styles.missionBar}">
            <div class="${styles.progressPanel}">
              <div class="${styles.progressText}">
                <p class="${styles.metaLabel}">Flugstrecke</p>
                <strong>Aufgabe ${progress}/${TASK_COUNT}</strong>
              </div>
              <div class="${styles.progressTrack} ${styles[`progress${completedTasks}`]}" aria-hidden="true">
                <div class="${styles.progressFill}"></div>
                <div class="${styles.progressShip}"></div>
              </div>
            </div>
            <div class="${styles.scoreCard}">
              <p class="${styles.metaLabel}">Punkte</p>
              <strong>${session.score}/200</strong>
            </div>
            <div class="${styles.scoreCard}">
              <p class="${styles.metaLabel}">Reihe</p>
              <strong>${session.table}er</strong>
            </div>
          </header>

          <div class="${styles.spaceField}">
            ${answerButtons}
            ${explosionOverlay}
            ${
              session.feedbackTone === 'success'
                ? `<div class="${styles.successBanner}" aria-hidden="true">Richtig!</div>`
                : ''
            }
            ${
              session.feedbackTone === 'reveal'
                ? `<div class="${styles.answerBanner}">Richtig: ${correctAnswer}</div>`
                : ''
            }
            <div class="${styles.ship} ${session.isShipShaking ? styles.shipShake : ''}" aria-label="Raumschiff mit Aufgabe ${session.displayFactor} mal ${session.table}">
              <div class="${styles.shipWindow}" id="game-title">
                <strong>${session.displayFactor}</strong>
                <small>mal</small>
              </div>
              <div class="${styles.shipBody}">
                <span>${session.table}</span>
              </div>
            </div>
          </div>

          <p class="${styles.statusText}" role="status">
            ${session.feedback}
          </p>
        </section>
        ${this.renderFooter()}
      </main>
    `;

    this.root.querySelectorAll<HTMLButtonElement>('[data-answer]').forEach((button) => {
      button.addEventListener('click', () => {
        button.blur();
        this.answer(Number(button.dataset.answer));
      });
    });

    if (session.isRolling && this.rollInterval === null) {
      this.startRollAnimation(currentTask.factor);
    }
  }

  private renderResult(): void {
    const session = this.requireSession();
    const stars = getStars(session.score);
    const hasTrophy = session.score === TASK_COUNT * MAX_POINTS_PER_TASK;
    const starIcons = Array.from({ length: stars }, () => '<span aria-hidden="true">★</span>').join(
      '',
    );

    this.root.innerHTML = `
      <main class="${styles.shell}">
        <section class="${styles.resultPanel}" aria-labelledby="result-title">
          <div class="${styles.confetti}" aria-hidden="true">
            ${Array.from({ length: 18 }, (_, index) => `<i class="${styles[`confetti${(index % 6) + 1}`]}"></i>`).join('')}
          </div>
          <p class="${styles.eyebrow}">Geschafft</p>
          <h1 id="result-title" class="${styles.title}">${session.score} von 200 Punkten</h1>
          <div class="${styles.award}" aria-label="${stars} Sterne${hasTrophy ? ' und Pokal' : ''}">
            ${hasTrophy ? '<span class="' + styles.trophy + '" aria-hidden="true">🏆</span>' : ''}
            <div class="${styles.stars}">${starIcons}</div>
          </div>
          <div class="${styles.resultActions}">
            <button class="${styles.primaryButton}" type="button" data-action="repeat">
              Nochmal ${session.table}er Reihe spielen
            </button>
            <button class="${styles.secondaryButton}" type="button" data-action="choose">
              Andere Zahlenreihe auswählen
            </button>
          </div>
        </section>
        ${this.renderFooter()}
      </main>
    `;

    this.root.querySelector<HTMLButtonElement>('[data-action="repeat"]')?.addEventListener(
      'click',
      () => this.startGame(session.table),
    );
    this.root.querySelector<HTMLButtonElement>('[data-action="choose"]')?.addEventListener(
      'click',
      () => {
        this.state = {
          screen: 'start',
          session: null,
          lastTable: session.table,
        };
        this.render();
      },
    );
  }

  private startGame(table: number): void {
    this.clearTimers();
    this.state = {
      screen: 'game',
      session: createSession(table),
      lastTable: table,
    };
    this.render();
  }

  private answer(answer: number): void {
    const session = this.requireSession();

    if (session.isRolling || session.isLocked) {
      return;
    }

    const correctAnswer = getCorrectAnswer(session);

    if (answer === correctAnswer) {
      const points = getAvailablePoints(session.misses);
      session.score += points;
      session.lastWrongAnswer = null;
      session.isShipShaking = false;
      session.meteorHits[correctAnswer] = Math.min((session.meteorHits[correctAnswer] ?? 0) + 1, 2);
      this.sound.play(session.meteorHits[correctAnswer] === 1 ? 'crack' : 'explosion');
      session.feedback = 'Richtig!';
      session.feedbackTone = 'success';
      session.isLocked = true;
      this.queueNextTask();
      this.render();
      return;
    }

    session.misses += 1;
    session.lastWrongAnswer = answer;
    session.isShipShaking = true;
    this.sound.play('wrong');

    if (getAvailablePoints(session.misses) === 0) {
      session.meteorHits[correctAnswer] = Math.min((session.meteorHits[correctAnswer] ?? 0) + 1, 2);
      session.feedback = `Die richtige Antwort ist ${correctAnswer}.`;
      session.feedbackTone = 'reveal';
      session.isLocked = true;
      this.queueNextTask();
      this.render();
      return;
    }

    session.feedback = 'Fast. Versuch es noch einmal.';
    session.feedbackTone = 'error';
    this.render();
  }

  private queueNextTask(): void {
    this.clearNextTimeout();

    this.nextTimeout = window.setTimeout(() => {
      this.nextTimeout = null;
      const session = this.requireSession();
      const nextIndex = session.currentIndex + 1;

      if (nextIndex >= session.tasks.length) {
        this.state.screen = 'result';
        this.sound.play('win');
        this.render();
        return;
      }

      session.currentIndex = nextIndex;
      session.misses = 0;
      session.displayFactor = session.tasks[nextIndex].factor;
      session.isRolling = true;
      session.isLocked = false;
      session.isShipShaking = false;
      session.lastWrongAnswer = null;
      session.feedback = 'Neue Aufgabe kommt.';
      session.feedbackTone = 'neutral';
      this.render();
    }, 1250);
  }

  private startRollAnimation(finalFactor: number): void {
    this.clearRollInterval();
    const session = this.requireSession();
    let ticks = 0;

    this.rollInterval = window.setInterval(() => {
      const activeSession = this.requireSession();
      ticks += 1;
      activeSession.displayFactor =
        Math.floor(Math.random() * (FACTOR_MAX - FACTOR_MIN + 1)) + FACTOR_MIN;

      if (ticks >= 9) {
        this.clearRollInterval();
        activeSession.displayFactor = finalFactor;
        activeSession.isRolling = false;
        activeSession.feedback = 'Tippe auf das richtige Ergebnis.';
        activeSession.feedbackTone = 'neutral';
      }

      this.render();
    }, 70);

    session.displayFactor =
      Math.floor(Math.random() * (FACTOR_MAX - FACTOR_MIN + 1)) + FACTOR_MIN;
  }

  private requireSession(): GameSession {
    if (!this.state.session) {
      throw new Error('Game session is missing.');
    }

    return this.state.session;
  }

  private renderFooter(): string {
    return `
      <footer class="${styles.footerText}">
        Made with 💚 by
        <a href="https://www.jenniferpelz.de" target="_blank" rel="noreferrer">Jennifer Pelz</a>.
        No Cookies. No Tracking.
      </footer>
    `;
  }

  private clearTimers(): void {
    this.clearRollInterval();
    this.clearNextTimeout();
  }

  private clearRollInterval(): void {
    if (this.rollInterval !== null) {
      window.clearInterval(this.rollInterval);
      this.rollInterval = null;
    }
  }

  private clearNextTimeout(): void {
    if (this.nextTimeout !== null) {
      window.clearTimeout(this.nextTimeout);
      this.nextTimeout = null;
    }
  }
}
