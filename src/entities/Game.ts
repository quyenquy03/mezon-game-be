class TurnResult {
  public turn: number;
  public player1Choice: string;
  public player2Choice: string;
  public winner: string;
}
class PlayerDice {
  public userId: string;
  public dice1: number;
  public dice2: number;
  public dice3: number;
  public total: number;
}
class DiceTurn {
  public turn: number;
  public player1Dice: PlayerDice;
  public player2Dice: PlayerDice;
  public winner: string;
}
class PlayerGroup {
  public player1: string;
  public player2: string;
  public results: TurnResult[] = [];
  public winner: string;
  public diceTurn?: DiceTurn;
}
class RoundGame {
  public roundId: string;
  public round: number;
  public playerOfRound: string[];
  public currentTurn: number;
  public playerGroup: PlayerGroup[] = [];
}

class Game {
  public gameId: string;
  public roomId: string;
  public status: string;
  public roundGame: RoundGame[] = [];
  public winner: string;
  public createdAt: Date;
  public currentRound: number;
  public turnOfRound: number;
  public isPlaying: boolean;
  public isEnd: boolean = false;
  public totalBet: number;
  public betOfOneGame: number;
  public listPlayers: string[];
}

export { RoundGame, PlayerGroup, Game, TurnResult };
