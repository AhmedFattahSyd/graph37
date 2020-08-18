import MpgRel from "./MpgRel";
import MpgItem from "./MpgItem";

export default class MpgTagRel extends MpgRel{
    
    public get tag(): MpgItem {
        return this.item2
    }

    public get item(): MpgItem {
        return this.item1
    }
}