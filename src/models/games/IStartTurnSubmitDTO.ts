import { Expose } from "class-transformer";
export class IStartTurnSubmitDTO {
  @Expose()
  public roomId: string;
  @Expose()
  public gameId: string;
  @Expose()
  public userId: string;
  @Expose()
  public currentRound: number;
  @Expose()
  public roundId: string;
  @Expose()
  public currentTurn: number;
}
