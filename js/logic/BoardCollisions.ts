import { fromJS, List } from "immutable";

import { Board } from "../objects/Board";
import { Coords } from "../objects/Coords";
import { Player } from "../objects/Player";
import { Tile } from "../objects/Tile";
import { Utils } from "./Utils";

import * as _ from "ramda";

interface ISplitItem {
  value: number;
  direction: number;
}

// Board Collide
// deals with egg splitting tiles

export const checkBoardCollisions = (
  board: Board,
  playerTypes,
  players: Player[]
): Player[] => {
  return addIDsToPlayers(
    players.reduce((newPlayers, player) => {
      const checkedPlayers = checkPlayerBoardCollision(board, playerTypes)(
        player
      );
      return [...newPlayers, ...checkedPlayers];
    }, [])
  );
};

// players need different IDs to make sure they make sense
const addIDsToPlayers = (players: Player[]): Player[] => {
  return players.map((player, index) => {
    return player.modify({
      id: index
    });
  });
};

const checkPlayerBoardCollision = (board: Board, playerTypes) => (
  player: Player
): Player[] => {
  return isCollision(board)(player)
    ? splitPlayer(playerTypes)(player)
    : [player];
};

const isCollision = (board: Board) => (player: Player) =>
  isPlayerInTile(player) &&
  isCollisionTile(board)(player) &&
  isPlayerValueHighEnough(player);

const isPlayerInTile = (player: Player): boolean =>
  player.coords.offsetX === 0 && player.coords.offsetY === 0;

const isCollisionTile = (board: Board) => (player: Player): boolean => {
  const collidedTiles = getCollidedTiles(board)(player);
  return collidedTiles.size > 0;
};

const isPlayerValueHighEnough = (player: Player): boolean => {
  return player.value > 1;
};
const isSplitterTile = (tile: Tile) => tile.get("action") === "split-eggs";

export const getSplitterTiles = (board: Board) => {
  return board.getAllTiles().filter(isSplitterTile);
};

const getCollidedTiles = (board: Board) => (player: Player) => {
  const isPlayerOnTileFunc = isPlayerOnTile(player);
  return getSplitterTiles(board).filter(isPlayerOnTileFunc);
};

export const isPlayerOnTile = (player: Player) => (tile: Tile): boolean => {
  return player.coords.x === tile.x && player.coords.y === tile.y;
};

// would be clevererer about this but we don't have many eggs
export const newValues = (value: number): number[] => {
  if (value === 2) {
    return [1, 1];
  }
  if (value === 3) {
    return [2, 1];
  }
  if (value === 4) {
    return [2, 2];
  }
  return [];
};

const combineDirectionsAndValues = (x, y): ISplitItem => {
  return {
    value: x,
    direction: y
  };
};

export const getValuesAndDirections = (value: number): ISplitItem[] => {
  const values = newValues(value);
  const directions = [-1, 1];

  return _.zipWith(combineDirectionsAndValues, values, directions);
};

export const splitPlayer = playerTypes => (player: Player): Player[] => {
  const items = getValuesAndDirections(player.value);
  const playerFromItemFunc = playerFromItem(playerTypes, player);

  return items.map(playerFromItemFunc);
};

const playerFromItem = (playerTypes, player: Player) => (
  item: ISplitItem
): Player => {
  const newPlayerType = Utils.getPlayerByValue(playerTypes, item.value);
  const newPlayerParams = (Object as any).assign({}, newPlayerType, {
    direction: new Coords({
      x: item.direction
    }),
    value: item.value,
    lastAction: "split"
  });
  return player.modify(newPlayerParams);
};
