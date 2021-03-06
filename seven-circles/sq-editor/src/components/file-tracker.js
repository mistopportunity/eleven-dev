import TitleBar from "../remote/title-bar.js";

function InstallFileTracker(target) {
    let unsaved = false, filePath = null;
    let baseFileName = "";
    target.hasRealPath = false;
    Object.defineProperties(target,{
        unsaved: {
            get: () => unsaved,
            set: value => {
                unsaved = value;
                target.updateTitle();
            }
        },
        filePath: {
            get: () => filePath,
            set: value => {
                filePath = value;
                const splitResult = filePath.split("seven-circles\\");
                baseFileName = splitResult.pop();
                target.updateTitle();
            }
        }
    });
    target.updateTitle = () => {
        if(!filePath) {
            TitleBar.clearTitle();
        } else {
            let title = baseFileName;
            if(unsaved) title += "*";
            TitleBar.title = title;
        }
    };
}
export default InstallFileTracker;
