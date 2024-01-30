//* TYPE INTERFACES
export interface Result {
    id: string;
    message: string;
    roomId: string;
    ts: number;
  }
  
export interface SenderData {
    username: string
    level: number
    rank: string
  }
  
export interface NewMessage{
    id: string
    message: string
    roomId: string
    sender: SenderData
    receiver: string
    ts: number
  }
  
  
export interface PrivateMessage{
    id: string
    message: string
    receiver: string
    roomId: string
    seen: boolean
    sender: SenderData
    ts: number
  }