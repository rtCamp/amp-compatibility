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

**The key components of the project:**

1.  **[AMP compatibility server]** 

    The AMP compatibility server is a Node JS application based on the [AdonisJS] framework. It is responsible for the following actions:

    - Collect data sent from AMP sites and storing into the BigQuery dataset.
    - Fetch and store plugins and themes from WordPress.org to BigQuery dataset, and keep dataset up to date with WordPress.org.
    - Generate a synthetic site for an individual plugin and theme from WordPress.org and store AMP validation error data in BigQuery.
    - Provide a dashboard to admin user to add adhoc request to generate synthetic data of combination of plugins and theme.

    Please check more information in [./amp-compatibility-server/README.md](./amp-compatibility-server/README.md).


2.  **[AMP WP Dummy data generator]** 

    The Dummy data generator is a WordPress plugin which is responsible for generating content for on a WP site in order to possibly trigger AMP validation errors.

    Please check more information in [./amp-wp-dummy-data-generator/README.md](./amp-wp-dummy-data-generator/README.md).

3.  🔒 **[AMP Compatibility Dashboard]**

    The compatibility dashboard is where an admin user can see current status of all the queues and information related to the jobs. Also, the admin user can add adhoc synthetic data generation request for a test run on a specific combination of a theme and plugins.

    ![AMP Compatibility Dashboard](https://user-images.githubusercontent.com/8168027/119304345-c0209d80-bc84-11eb-840f-e31fa8dd0e9f.png)


## Infrastructure

![GCP Infrastructure](https://user-images.githubusercontent.com/8168027/108815329-47a13680-75da-11eb-8e29-8e4432413e1f.jpg)


## Local environment setup

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

Please check [./amp-wp-dummy-data-generator](./amp-wp-dummy-data-generator) to set up AMP WP dummy data generator.

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
[Reporting dashboard]: https://datastudio.google.com/reporting/33e24fa4-a3e3-49ff-b2e1-8ba235a7424f/page/eCjyB
[AMP Compatibility Dashboard]: https://rich-torus-221321.ue.r.appspot.com/
