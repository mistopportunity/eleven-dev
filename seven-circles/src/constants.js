const WorldCanvasScale = 1;
const BaseScreenMargin = 8;
const BaseCameraScale = 8;

const ByCanvasScale = value => Math.ceil(WorldCanvasScale * value);

const Constants = Object.freeze({
    Namespace: "SVCC",

    PlayerSpeed: 3,
    NPCSpeed: 2.5,

    FaderDuration: 500,
    FakeLoadingTime: 500,

    WorldCanvasScale,
    DefaultCameraScale: ByCanvasScale(BaseCameraScale),
    WorldUIScreenMargin: ByCanvasScale(BaseScreenMargin),

    TriggerTiles: 15,
    DevSaveFile: "dev-save",

    GlobalResourceFile: "caches/global",
    WorldPreloadFile: "caches/world",

    SaveStateAddress: "SVCC_SAVE_STATE_DATA",
    KeyBindAddress: "SVCC_KEY_BINDS",

    MusicVolumeKey: "SVCC_MUSIC_VOLUME",
    SoundVolumeKey: "SVCC_SOUND_VOLUME",

    MusicVolume: 0.2,
    SoundVolume: 0.8,

    MinVolume: 0,
    MaxVolume: 1,

    PlayerSprite: "player/default",
    GameStartScript: "HelloWorld",
    ErrorLevel: "ErrorPlace",

    MenuSong: "Menu",

    LogTileUpdates: false,
    AutoSelectInventory: false
});
export default Constants;
