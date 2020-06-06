import {structNode, listNode, booleanNode, integerNode, doubleNode, stringNode, nullNode} from 'sur-node';

export const Slot = structNode({people: listNode(structNode({name: stringNode(), pronouns: listNode(stringNode())})), startTime: integerNode(), endTime: integerNode()});
export const AddToPartyResponse = structNode({success: booleanNode(), time: structNode({people: listNode(structNode({name: stringNode(), pronouns: listNode(stringNode())})), startTime: integerNode(), endTime: integerNode()})});
export const ChatMessage = structNode({time: integerNode(), content: stringNode()});
export const ChatUpdate = structNode({time: integerNode(), content: stringNode(), author: structNode({name: stringNode(), pronouns: listNode(stringNode())})});
export const AddToParty = { request: structNode({name: stringNode(), pronouns: listNode(stringNode())}), response: structNode({success: booleanNode(), time: structNode({people: listNode(structNode({name: stringNode(), pronouns: listNode(stringNode())})), startTime: integerNode(), endTime: integerNode()})})};
export const Chat = { incoming: structNode({time: integerNode(), content: stringNode()}), outgoing: structNode({time: integerNode(), content: stringNode(), author: structNode({name: stringNode(), pronouns: listNode(stringNode())})})};
export const PartyService = {name: "PartyService", variables: {AddToParty, Chat}};
