function DoorRenderer(image,x,y,tileSize,normal,top,bottom,duration) {
    this.openStart = null, this.closeStart = null;

    this.x = x, this.y = y;
    this.width = 1, this.height = 3;

    this.open = false;

    const renderStatic = (context,x,y,width,open) => {
        const renderSize = width;

        if(open) {
            context.drawImage(
                image,top[0],top[1],tileSize,tileSize,
                x,y,renderSize,renderSize
            );
            context.drawImage(
                image,bottom[0],bottom[1],tileSize,tileSize,
                x,y+renderSize*2,renderSize,renderSize
            );
        } else {
            const [texX,texY] = normal;
            context.drawImage(
                image,texX,texY,tileSize,tileSize,
                x,y,renderSize,renderSize
            );
            context.drawImage(
                image,texX,texY,tileSize,tileSize,
                x,y+renderSize,renderSize,renderSize
            );
            context.drawImage(
                image,texX,texY,tileSize,tileSize,
                x,y+renderSize*2,renderSize,renderSize
            );
        }
    };
    const renderMoving = (context,x,y,width,t) => {
        const renderSize = width;

        const movementDistance = renderSize * t;
        const middleStart = y + renderSize;

        context.drawImage(
            image,top[0],top[1],tileSize,tileSize,
            x,middleStart- movementDistance,renderSize,renderSize
        );
        context.drawImage(
            image,bottom[0],bottom[1],tileSize,tileSize,
            x,middleStart + movementDistance,renderSize,renderSize
        );


        const [texX,texY] = normal;

        t = 1 - t;

        const animatedTileSize = tileSize - (tileSize * t);

        context.drawImage(
            image,texX,texY,tileSize,animatedTileSize,
            x,y,renderSize,renderSize * t
        );

        context.drawImage(
            image,texX,texY,tileSize,animatedTileSize,
            x,y+renderSize*2 + movementDistance,
            renderSize,renderSize - movementDistance
        );
    };

    this.render = (context,x,y,width,_,time) => {
        if(this.openStart !== null) {
            let t = (time.now-this.openStart) / duration;
            if(isNaN(t) || t <= 0) {
                renderStatic(context,x,y,width,false);
                return;
            } else if(t > 1) {
                renderStatic(context,x,y,width,this.open,true);
                return;
            }
            renderMoving(context,x,y,width,t);
        } else if(this.closeStart !== null) {
            let t = (time.now-this.closeStart) / duration;
            if(isNaN(t)|| t <= 0) {
                renderStatic(context,x,y,width,true);
                return;
            } else if(t > 1) {
                renderStatic(context,x,y,width,false);
                return;
            }
            renderMoving(context,x,y,width,1 - t);
        } else {
            renderStatic(context,x,y,width,this.open);
        }
    };
}
export default DoorRenderer;
