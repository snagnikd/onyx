import asyncio
import websockets
import json
from websockets.server import serve;

clients = {}
z = ""
async def get_clients(websocket):
    global z
    if not z:
        z = websocket
        d = {"mode":"status","colour":"White"}
        await websocket.send(json.dumps(d))
    else:
        clients[z] = websocket
        clients[websocket] = z
        z = ""
        d = {"mode":"status","colour":"Black"}
        await websocket.send(json.dumps(d))


    try:
            async for message in websocket:
                    data = json.loads(message)
                    await clients[websocket].send(json.dumps(data))

                    # if data["mode"]=="move":
                    #     await clients[websocket].send(json.dumps(data))

                    #     #    z = await clients[other].recv()
                    # elif data["mode"]=="undo":
                    #     await clients[websocket].send(json.dumps(data))

                    # elif data["mode"] == "reset":
                    #     await clients[websocket].send(json.dumps(data)) 



    except websockets.ConnectionClosed:
                # Connection was closed
                pass

async def main():
        async with serve(get_clients,"localhost",8001):
            await asyncio.Future()
asyncio.run(main())
        



# undo move permission
# usual move
# reset then restore the colours
