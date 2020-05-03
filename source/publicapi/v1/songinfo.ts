import syslog from '../../corefunc/syslog';
import APIError from '../../corefunc/apierror';
import arcsong_sid_byany from '../../database/database.arcsong.sid.byany';
import arcsong_bysongid from '../../database/database.arcsong.bysongid';

const TAG = 'v1/songinfo.ts\t';
export default (argument: any): Promise<any> => {

  return new Promise(async (resolve, reject) => {

    try {

      // /songinfo?songname=xxx
      // check for request arguments
      if (typeof argument.songname == 'undefined' || argument.songname == '')
        throw new APIError(-1, 'invalid songname');

      let _arc_songid = null;
      let _arc_songinfo = null;

      // query songid by any string
      try {
        _arc_songid = await arcsong_sid_byany(argument.songname);
      } catch (e) { syslog.e(TAG, e.stack); throw new APIError(-2, 'this song is not recorded in the database'); }

      if (_arc_songid.length > 1)
        throw new APIError(-3, 'too many records');
      _arc_songid = _arc_songid[0];

      // get song information by songid
      try {
        _arc_songinfo = await arcsong_bysongid(_arc_songid);
      } catch (e) { syslog.e(TAG, e.stack); throw new APIError(-4, 'internal error'); }

      const _return = {
        id: _arc_songinfo.sid,
        title_localized: {
          en: _arc_songinfo.name_en,
          ja: _arc_songinfo.name_jp
        },
        artist: _arc_songinfo.artist,
        bpm: _arc_songinfo.bpm,
        bpm_base: _arc_songinfo.bpm_base,
        set: _arc_songinfo.pakset,
        audioTimeSec: _arc_songinfo.time,
        side: _arc_songinfo.side,
        remote_dl: _arc_songinfo.remote_download == 'true' ? true : false,
        world_unlock: _arc_songinfo.world_unlock == 'true' ? true : false,
        date: _arc_songinfo.date,
        difficulties: [
          {
            ratingClass: 0,
            chartDesigner: _arc_songinfo.chart_designer_pst,
            jacketDesigner: _arc_songinfo.jacket_designer_pst,
            rating: _arc_songinfo.rating_pst
          },
          {
            ratingClass: 1,
            chartDesigner: _arc_songinfo.chart_designer_prs,
            jacketDesigner: _arc_songinfo.jacket_designer_prs,
            rating: _arc_songinfo.rating_prs
          },
          {
            ratingClass: 2,
            chartDesigner: _arc_songinfo.chart_designer_ftr,
            jacketDesigner: _arc_songinfo.jacket_designer_ftr,
            rating: _arc_songinfo.rating_ftr
          }
        ]
      };

      // remove empty field
      if (_return.title_localized.ja == '')
        delete _return.title_localized.ja;

      resolve(_return);

    } catch (e) {

      if (e instanceof APIError)
        return reject(e);

      syslog.e(TAG, e.stack);
      return reject(new APIError(-233, 'unknown error occurred'));

    }

  });

}