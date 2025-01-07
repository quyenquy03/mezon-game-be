import { ICombineNextRoundSubmitDTO } from "@/models/games/ICombineRoundSubmitDTO";
import { IContinueJoinGameSubmitDTO } from "@/models/games/IContinueJoinGameSubmitDTO";
import { IEndGameDTO } from "@/models/games/IEndGameDTO";
import { IGetTurnResultDTO } from "@/models/games/IGetTurnResultDTO";
import { ISubmitTurnDTO } from "@/models/games/ISubmitTurnDTO";

export interface IGameService {
  checkBeforeStartNewGame({ roomId }: { roomId: string }): Promise<ServiceResponse>;
  startNewGame({ roomId }: { roomId: string }): Promise<ServiceResponse>;
  getGameById(gameId: string): Promise<ServiceResponse>;
  getRoundOfGame(gameId: string, round: number): Promise<ServiceResponse>;
  submitTurn(data: ISubmitTurnDTO): Promise<ServiceResponse>;
  getTurnResult(data: IGetTurnResultDTO): Promise<ServiceResponse>;
  continueJoinGame(data: IContinueJoinGameSubmitDTO): Promise<ServiceResponse>;
  combineNextRound(data: ICombineNextRoundSubmitDTO): Promise<ServiceResponse>;
  endGame(data: IEndGameDTO): Promise<ServiceResponse>;
}
