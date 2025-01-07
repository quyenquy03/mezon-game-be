import { Expose } from "class-transformer";
export class IEndGameDTO {
  @Expose()
  public roomId: string;
  @Expose()
  public gameId: string;
  @Expose()
  public winner: string;
  @Expose()
  public totalBet?: number;
  @Expose()
  public betOfOneGame?: number;
}
