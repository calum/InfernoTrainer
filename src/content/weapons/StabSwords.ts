import * as itemData from '../../assets/equipment.json';
import { ItemFactory } from '../ItemFactory';

const items = (itemData as any).default; 

export function getItemByName(name: string) {
    const equipmentData = items.find((item: any) => item.name === name);
    if (equipmentData) {
        return ItemFactory.createItem(equipmentData);
    }
    return null;
}