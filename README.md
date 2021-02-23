# AMP Compatibility

AMP compatibility project to make WordPress ecosystem AMP compatible.

**Repo Access Available To**

| Google Team       | rtCamp Team        |
|-------------------|--------------------|
| [Alberto Medina]  | [Rahul Bansal]     |
| [Weston Ruter]    | [Dhaval Parekh]    |
| [Felix Arntz]     | [Paul Clark]       |
| [Alain Schlesser] | [Riddhesh Sanghvi] |
| [James G]         | [Gagan Deep Singh] |
| -                 | [Pradeep Sonawane] |
| -                 | [Milind More]      |
| -                 | [Maitreyie Chavan] |

---

## Description

**The key components of the project.**

1.  **[AMP compatibility server]** 

    The AMP compatibility server is a Node JS application based on the [AdonisJS] framework. It is responsible for following actions:

    - Collecting data sent from AMP sites and storing into the BigQuery dataset.
    - Fetch and store plugins and themes from [WordPress.org] to BigQuery dataset, and keep dataset up to date with [WordPress.org].
    - Generate a synthetic site for an individual plugin and theme from [WordPress.org] and store AMP errors information in BigQuery.
    - Provide a dashboard to admin user to add adhoc request to generate synthetic data of combination of plugins and theme.

    Please check more information in [./amp-compatibility-server/README.md](./amp-compatibility-server/README.md).


2.  **[AMP WP Dummy data generator]** 

    The Dummy data generator is a WordPress plugin. Which is responsible for generating ideal content for the AMP site. So it can expose AMP errors.

    Please check more information in [./amp-wp-dummy-data-generator/README.md](./amp-wp-dummy-data-generator/README.md).

3.  **[AMP Compatibility Dashboard]**

    The Basic dashboard where admin user can see current status of all the queues, And it's jobs related information. Also, user can add adhoc synthetic data generation request. For run test on combination of plugins and theme.

    ![AMP Compatibility Dashboard](https://user-images.githubusercontent.com/8168027/108818408-5807e000-75df-11eb-885a-be1bbd5a7b8d.png)


4.  **[Reporting dashboard]**

    The [AMP Compatibility Database - Dashboard] report visualizes the data gathered
    by [AMP compatibility server] in Google Data Studio.

    ![AMP Compatibility Reporting Dashboard](https://user-images.githubusercontent.com/8168027/108817704-4ffb7080-75de-11eb-8ab2-07b01071970a.png)


## Infrastructure

![GCP Infrastructure](https://user-images.githubusercontent.com/8168027/108815329-47a13680-75da-11eb-8e29-8e4432413e1f.jpg)


## Local environment setup.

### Required software
- [Node JS](https://nodejs.org/) v14.15.3
- [Npm JS](https://www.npmjs.com/) >= 3.0.0
- [Adonis CLI](https://adonisjs.com/docs/4.1/about) ( `npm i -g @adonisjs/cli` )
- [Redis](https://redis.io/)
- For Ubuntu
    - [WordOps](https://wordops.net/)
- For Mac
    - [Laravel Valet](https://laravel.com/docs/8.x/valet)
    - [WP CLI valet command](https://github.com/aaemnnosttv/wp-cli-valet-command#installing) 

Please check [./amp-compatibility-server#setup](./amp-compatibility-server#setup) to set up AMP compatibility server.

Please check [./amp-wp-dummy-data-generator#setup](./amp-wp-dummy-data-generator#setup) to set up AMP WP dummy data generator.

[AMP compatibility server]: ./amp-compatibility-server/README.md
[AMP WP Dummy data generator]: ./amp-wp-dummy-data-generator/README.md
[Google]: https://profiles.wordpress.org/google
[rtCamp]: https://github.com/rtCamp/
[Alberto Medina]: https://github.com/amedina
[Rahul Bansal]: https://github.com/rahul286
[Weston Ruter]: https://github.com/westonruter
[Felix Arntz]: https://github.com/felixarntz
[Alain Schlesser]: https://github.com/schlessera
[James G]: https://github.com/jamesozzie
[Paul Clark]: https://github.com/pdclark
[Riddhesh Sanghvi]: https://github.com/mrrobot47
[Gagan Deep Singh]: https://github.com/gagan0123
[Dhaval Parekh]: https://github.com/dhaval-parekh
[Maitreyie Chavan]: https://github.com/maitreyie-chavan
[Milind More]: https://github.com/milindmore22
[Pradeep Sonawane]: https://github.com/pradeep910
[AdonisJS]: https://adonisjs.com/docs/4.1/about
[WordPress.org]: https://wordpress.org/
[Reporting dashboard]: https://datastudio.google.com/reporting/33e24fa4-a3e3-49ff-b2e1-8ba235a7424f/page/eCjyB
[AMP Compatibility Dashboard]: https://rich-torus-221321.ue.r.appspot.com/
