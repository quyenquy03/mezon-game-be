import "module-alias/register";
import Application from "./app";
import container from "./container";
import { SocketGameService } from "./services";
import SocketService from "./services/socket/SocketService";
container.resolve<Application>("Application");
// container.resolve<SocketGameService>("SocketGameService");
container.resolve<SocketService>("SocketService");
