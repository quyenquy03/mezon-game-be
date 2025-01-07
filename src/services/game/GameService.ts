import logger from "@/helpers/logger";
import { IGameService } from "@/interfaces/IGameService";
import { IRoomService } from "@/interfaces/IRoomService";
import RoomService from "../room/RoomService";
import { Game, PlayerGroup, RoundGame, TurnResult } from "@/entities/Game";
import { Room } from "@/entities/Room";
import { generateId } from "@/utils/generateId";
import { ISubmitTurnDTO } from "@/models/games/ISubmitTurnDTO";
import { IGetTurnResultDTO } from "@/models/games/IGetTurnResultDTO";
import { IContinueJoinGameSubmitDTO } from "@/models/games/IContinueJoinGameSubmitDTO";
import { ICombineNextRoundSubmitDTO } from "@/models/games/ICombineRoundSubmitDTO";
import { IEndGameDTO } from "@/models/games/IEndGameDTO";

class GameService implements IGameService {
  private static instance: GameService;
  private listGames: Array<Game> = [];
  private _roomService: IRoomService;

  private constructor() {
    this._roomService = RoomService.getInstance();
  }

  public static getInstance(): GameService {
    if (!GameService.instance) {
      GameService.instance = new GameService();
    }
    return GameService.instance;
  }
  public async checkBeforeStartNewGame({ roomId }: { roomId: string }): Promise<ServiceResponse> {
    try {
      const room = await this._roomService.getRoomById(roomId);
      if (!room || !room.isSuccess) {
        return room;
      }
      if (room.data.roomMembers.length < 2) {
        return {
          statusCode: 400,
          isSuccess: false,
          errorMessage: "Phòng chưa đủ người chơi",
        };
      }
      if (room.data.isPlaying) {
        return {
          statusCode: 400,
          isSuccess: false,
          errorMessage: "Phòng đang trong trạng thái chơi",
        };
      }
      if (room.data.roomMembers.length !== +room.data.roomInfo.roomMaxUser) {
        return {
          statusCode: 400,
          isSuccess: false,
          errorMessage: `Phòng cần ${room.data.roomInfo.roomMaxUser} người để chơi`,
        };
      }
      const game = this.listGames.find((game) => game.roomId === roomId && game.isPlaying);
      if (game) {
        return {
          statusCode: 400,
          isSuccess: false,
          errorMessage: "Phòng đang trong trạng thái chơi",
        };
      }
      return {
        statusCode: 200,
        isSuccess: true,
        data: room.data,
      };
    } catch (error) {
      logger.error(error?.message);
      return {
        statusCode: 500,
        isSuccess: false,
        errorMessage: "Lỗi từ hệ thống",
      };
    }
  }
  public async startNewGame({ roomId }: { roomId: string }): Promise<ServiceResponse> {
    try {
      const roomResponse = await this._roomService.getRoomById(roomId);
      if (!roomResponse || !roomResponse.isSuccess) {
        return roomResponse;
      }
      const room = roomResponse.data as Room;

      const roomMembers = room.roomMembers;
      const playerGroup: Array<PlayerGroup> = [];
      for (let i = 0; i < roomMembers.length / 2; i++) {
        const playerGroupItem = new PlayerGroup();
        playerGroupItem.player1 = roomMembers[i];
        playerGroupItem.player2 = roomMembers[roomMembers.length - 1 - i];
        for (let j = 0; j < room.roomInfo.roomRound; j++) {
          const turnResult = new TurnResult();
          turnResult.turn = j + 1;
          turnResult.player1Choice = null;
          turnResult.player2Choice = null;
          turnResult.winner = null;
          playerGroupItem.results.push(turnResult);
        }
        playerGroup.push(playerGroupItem);
      }

      const roundGame = new RoundGame();
      roundGame.roundId = generateId(6, "mixed");
      roundGame.currentTurn = 1;
      roundGame.round = 1;
      roundGame.playerOfRound = room.roomMembers;
      roundGame.playerGroup = playerGroup;

      const game = new Game();
      game.roomId = roomId;
      game.gameId = generateId(10, "mixed");
      game.listPlayers = room.roomMembers;
      game.currentRound = 1;
      game.turnOfRound = room.roomInfo.roomRound;
      game.totalBet = room.roomInfo.roomBet * room.roomMembers.length;
      game.betOfOneGame = room.roomInfo.roomBet;
      game.isPlaying = true;
      game.winner = "";
      game.createdAt = new Date();
      game.roundGame.push(roundGame);

      this.listGames.push(game);

      return {
        statusCode: 200,
        isSuccess: true,
        data: game,
      };
    } catch (error) {
      logger.error(error?.message);
      return {
        statusCode: 500,
        isSuccess: false,
        errorMessage: "Lỗi từ hệ thống",
      };
    }
  }
  public async getGameById(gameId: string): Promise<ServiceResponse> {
    try {
      const game = this.listGames.find((game) => game.gameId === gameId);
      if (!game) {
        return {
          statusCode: 404,
          isSuccess: false,
          errorMessage: "Không tìm thấy trận đấu",
        };
      }
      return {
        statusCode: 200,
        isSuccess: true,
        data: game,
      };
    } catch (error) {
      logger.error(error?.message);
      return {
        statusCode: 500,
        isSuccess: false,
        errorMessage: "Lỗi từ hệ thống",
      };
    }
  }
  public async getRoundOfGame(gameId: string, round: number): Promise<ServiceResponse> {
    try {
      const game = this.listGames.find((game) => game.gameId === gameId);
      if (!game) {
        return {
          statusCode: 404,
          isSuccess: false,
          errorMessage: "Không tìm thấy trận đấu",
        };
      }
      const roundGame = game.roundGame.find((roundGame) => roundGame.round === round);
      if (!roundGame) {
        return {
          statusCode: 404,
          isSuccess: false,
          errorMessage: "Không tìm thấy vòng đấu",
        };
      }
      return {
        statusCode: 200,
        isSuccess: true,
        data: roundGame,
      };
    } catch (error) {
      logger.error(error?.message);
      return {
        statusCode: 500,
        isSuccess: false,
        errorMessage: "Lỗi từ hệ thống",
      };
    }
  }

  public async submitTurn(data: ISubmitTurnDTO): Promise<ServiceResponse> {
    try {
      const game = await this.getGameById(data.gameId);
      if (!game || !game.isSuccess) {
        return game;
      }
      const gameData = game.data as Game;
      const roundGame = gameData.roundGame.find((roundGame) => roundGame.roundId === data.roundId);
      if (!roundGame) {
        return {
          statusCode: 404,
          isSuccess: false,
          errorMessage: "Không tìm thấy vòng đấu",
        };
      }
      const playerGroup = roundGame.playerGroup.find(
        (playerGroup) => playerGroup.player1 === data.userId || playerGroup.player2 === data.userId
      );
      if (!playerGroup) {
        return {
          statusCode: 404,
          isSuccess: false,
          errorMessage: "Không tìm thấy người chơi",
        };
      }
      const turnResult = playerGroup.results.find((turnResult) => turnResult.turn === data.currentTurn);
      if (!turnResult) {
        return {
          statusCode: 404,
          isSuccess: false,
          errorMessage: "Không tìm thấy lượt chơi",
        };
      }
      if (playerGroup.player1 === data.userId) {
        turnResult.player1Choice = data.choice === null ? "" : data.choice;
      } else {
        turnResult.player2Choice = data.choice === null ? "" : data.choice;
      }
      return {
        statusCode: 200,
        isSuccess: true,
      };
    } catch (error) {
      logger.error(error?.message);
      return {
        statusCode: 500,
        isSuccess: false,
        errorMessage: "Lỗi từ hệ thống",
      };
    }
  }

  private checkWinner(player1: string, player2: string, player1Choice?: string | null, player2Choice?: string | null) {
    if (player1Choice === player2Choice) {
      return null;
    }
    if ((player1Choice === null || player1Choice?.trim() === "") && (player2Choice === null || player2Choice?.trim() === "")) {
      return null;
    }
    if (!player1Choice) {
      return player2;
    }
    if (!player2Choice) {
      return player1;
    }
    if (player1Choice === "rock" && player2Choice === "scissors") {
      return player1;
    }
    if (player1Choice === "rock" && player2Choice === "paper") {
      return player2;
    }
    if (player1Choice === "paper" && player2Choice === "rock") {
      return player1;
    }
    if (player1Choice === "paper" && player2Choice === "scissors") {
      return player2;
    }
    if (player1Choice === "scissors" && player2Choice === "rock") {
      return player2;
    }
    if (player1Choice === "scissors" && player2Choice === "paper") {
      return player1;
    }
  }

  public async getTurnResult(data: IGetTurnResultDTO): Promise<ServiceResponse> {
    try {
      const game = await this.getGameById(data.gameId);
      if (!game || !game.isSuccess) {
        return game;
      }
      const gameData = game.data as Game;
      const roundGame = gameData.roundGame.find((roundGame) => roundGame.roundId === data.roundId);
      if (!roundGame) {
        return {
          statusCode: 404,
          isSuccess: false,
          errorMessage: "Không tìm thấy vòng đấu",
        };
      }
      const playerGroup = roundGame.playerGroup.find(
        (playerGroup) => playerGroup.player1 === data.userId || playerGroup.player2 === data.userId
      );
      if (!playerGroup) {
        return {
          statusCode: 404,
          isSuccess: false,
          errorMessage: "Không tìm thấy người chơi",
        };
      }
      const turnResult = playerGroup.results.find((turnResult) => turnResult.turn === data.currentTurn);
      if (!turnResult) {
        return {
          statusCode: 404,
          isSuccess: false,
          errorMessage: "Không tìm thấy lượt chơi",
        };
      }
      if (turnResult.player1Choice === null || turnResult.player2Choice === null) {
        return {
          statusCode: 400,
          isSuccess: false,
          errorMessage: "Chưa chọn lựa chọn",
        };
      }
      const checkWinner = this.checkWinner(
        playerGroup.player1,
        playerGroup.player2,
        turnResult.player1Choice,
        turnResult.player2Choice
      );
      turnResult.winner = checkWinner;
      const result = {
        player1Id: playerGroup.player1,
        player2Id: playerGroup.player2,
        player1Choice: turnResult.player1Choice,
        player2Choice: turnResult.player2Choice,
        winner: checkWinner,
      };
      return {
        statusCode: 200,
        isSuccess: true,
        data: result,
      };
    } catch (error) {
      logger.error(error?.message);
      return {
        statusCode: 500,
        isSuccess: false,
        errorMessage: "Lỗi từ hệ thống",
      };
    }
  }

  public async continueJoinGame(data: IContinueJoinGameSubmitDTO): Promise<ServiceResponse> {
    try {
      const game = await this.getGameById(data.gameId);
      if (!game || !game.isSuccess) {
        return game;
      }
      const gameData = game.data as Game;
      const roundGame = gameData.roundGame.find((round) => round.round === data.currentRound);
      if (!roundGame) {
        const newRound = new RoundGame();
        newRound.roundId = generateId(6, "mixed");
        newRound.currentTurn = 1;
        newRound.round = data.currentRound;
        newRound.playerOfRound = [];
        newRound.playerGroup = [];
        gameData.roundGame.push(newRound);
      }

      const newRoundGame = gameData.roundGame.find((round) => round.round === data.currentRound);
      const checkUserInRound = newRoundGame.playerOfRound.find((userId) => userId === data.userId);
      if (!checkUserInRound) {
        newRoundGame.playerOfRound.push(data.userId);
      }
      return {
        statusCode: 200,
        isSuccess: true,
        data: newRoundGame.roundId,
      };
    } catch (error) {
      logger.error(error?.message);
      return {
        statusCode: 500,
        isSuccess: false,
        errorMessage: "Lỗi từ hệ thống",
      };
    }
  }
  public async combineNextRound(data: ICombineNextRoundSubmitDTO): Promise<ServiceResponse> {
    try {
      const roundGame = await this.getRoundOfGame(data.gameId, data.currentRound);
      if (!roundGame || !roundGame.isSuccess) {
        return roundGame;
      }
      const roundGameData = roundGame.data as RoundGame;
      const room = await this._roomService.getRoomById(data.roomId);
      if (!room || !room.isSuccess) {
        return room;
      }
      const roomData = room.data as Room;
      for (let i = 0; i < roundGameData.playerOfRound.length / 2; i++) {
        const turnNumber = roomData.roomInfo.roomRound;
        const player1 = roundGameData.playerOfRound[i];
        const player2 = roundGameData.playerOfRound[roundGameData.playerOfRound.length - 1 - i];

        const listTurnResult = [];
        for (let j = 0; j < turnNumber; j++) {
          const turnResult = new TurnResult();
          turnResult.turn = j + 1;
          turnResult.player1Choice = null;
          turnResult.player2Choice = null;
          turnResult.winner = null;
          listTurnResult.push(turnResult);
        }
        const playerGroup = new PlayerGroup();
        playerGroup.player1 = player1;
        playerGroup.player2 = player2;
        playerGroup.results = listTurnResult;
        roundGameData.playerGroup.push(playerGroup);
      }
      return {
        statusCode: 200,
        isSuccess: true,
        data: roundGameData.roundId,
      };
    } catch (error) {
      logger.error(error?.message);
      return {
        statusCode: 500,
        isSuccess: false,
        errorMessage: "Lỗi từ hệ thống",
      };
    }
  }

  public async endGame(data: IEndGameDTO): Promise<ServiceResponse> {
    try {
      const room = await this._roomService.getRoomById(data.roomId);
      if (!room || !room.isSuccess) {
        return room;
      }
      const roomData = room.data as Room;
      roomData.isPlaying = false;

      const game = await this.getGameById(data.gameId);
      if (!game || !game.isSuccess) {
        return game;
      }
      const gameData = game.data as Game;
      gameData.isPlaying = false;
      gameData.winner = data.winner;

      const endGameData: IEndGameDTO = {
        roomId: data.roomId,
        gameId: data.gameId,
        winner: data.winner,
        totalBet: gameData.totalBet,
        betOfOneGame: gameData.betOfOneGame,
      };
      return {
        statusCode: 200,
        isSuccess: true,
        data: endGameData,
      };
    } catch (error) {
      logger.error(error?.message);
      return {
        statusCode: 500,
        isSuccess: false,
        errorMessage: "Lỗi từ hệ thống",
      };
    }
  }
}

export default GameService;
